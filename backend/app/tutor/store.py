"""
Persistence for the two things the tutor needs to survive across requests:
daily usage counters (for rate limiting) and the answer cache.

Backed by Supabase (see backend/supabase/schema.sql for the tables + the
tutor_usage_try_consume() function this calls). If Supabase isn't
configured — no SUPABASE_URL / SUPABASE_SERVICE_KEY — everything here
falls back to an in-memory dict, purely so local development works without
setting up a database. That fallback is NOT safe for production: it resets
on every restart, doesn't survive Render's free-tier spin-down, and isn't
shared across multiple worker processes if you ever scale past one.
"""
import time
import hashlib
import re
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Optional

from app.tutor import config
from app.tutor.supabase_client import get_client


@dataclass
class RateLimitResult:
    allowed: bool
    reason: Optional[str] = None  # 'cooldown' | 'daily_limit' | None
    count: int = 0
    retry_after_seconds: Optional[int] = None


@dataclass
class CachedAnswer:
    answer: str
    navigation_to: Optional[str] = None
    navigation_label: Optional[str] = None


# ── In-memory fallback (local dev only) ─────────────────────────────────
_mem_usage: dict[str, dict] = {}
_mem_cache: dict[str, CachedAnswer] = {}


def _today_str() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%d")


def _mem_try_consume(client_key: str, daily_limit: int, cooldown_seconds: int) -> RateLimitResult:
    key = f"{client_key}:{_today_str()}"
    now = time.time()
    row = _mem_usage.get(key)
    if row:
        if cooldown_seconds > 0 and now - row["last"] < cooldown_seconds:
            return RateLimitResult(False, "cooldown", row["count"], int(cooldown_seconds - (now - row["last"])) + 1)
        if row["count"] >= daily_limit:
            return RateLimitResult(False, "daily_limit", row["count"])
        row["count"] += 1
        row["last"] = now
        return RateLimitResult(True, None, row["count"])
    _mem_usage[key] = {"count": 1, "last": now}
    return RateLimitResult(True, None, 1)


# ── Public API ───────────────────────────────────────────────────────────

def try_consume(client_key: str, daily_limit: int, cooldown_seconds: int) -> RateLimitResult:
    client = get_client()
    if client is None:
        return _mem_try_consume(client_key, daily_limit, cooldown_seconds)

    try:
        result = client.rpc(
            "tutor_usage_try_consume",
            {
                "p_client_key": client_key,
                "p_daily_limit": daily_limit,
                "p_cooldown_seconds": cooldown_seconds,
            },
        ).execute()
    except Exception as exc:
        # Supabase is configured but the call itself failed — wrong key,
        # schema.sql was never run (function doesn't exist), network
        # hiccup, etc. This used to propagate as an unhandled exception
        # and crash the request with a 500 (which also meant the response
        # never got CORS headers, since FastAPI's error-handling layer
        # sits outside CORSMiddleware — the browser reports that as a CORS
        # error even though the real cause is this exception). Falling
        # back to in-memory keeps the tutor working; the print goes to
        # Render's logs so the misconfiguration is still visible.
        print(f"[tutor] Supabase rate-limit call failed, falling back to in-memory: {exc}")
        return _mem_try_consume(client_key, daily_limit, cooldown_seconds)

    row = result.data[0] if result.data else None
    if not row:
        # Call succeeded but returned nothing usable — same fail-open
        # reasoning as above.
        return RateLimitResult(True, None, 0)
    return RateLimitResult(
        allowed=row["allowed"],
        reason=row["reason"],
        count=row["count"],
        retry_after_seconds=row.get("retry_after_seconds"),
    )


def remaining_for_anon(anon_key: str, daily_limit: int) -> int:
    """Read-only: how many questions this identity has left today, without consuming one."""
    client = get_client()
    if client is None:
        row = _mem_usage.get(f"{anon_key}:{_today_str()}")
        used = row["count"] if row else 0
        return max(0, daily_limit - used)

    try:
        result = (
            client.table("tutor_usage")
            .select("count")
            .eq("client_key", anon_key)
            .eq("usage_date", _today_str())
            .execute()
        )
    except Exception as exc:
        print(f"[tutor] Supabase usage lookup failed, reporting from in-memory: {exc}")
        row = _mem_usage.get(f"{anon_key}:{_today_str()}")
        used = row["count"] if row else 0
        return max(0, daily_limit - used)
    used = result.data[0]["count"] if result.data else 0
    return max(0, daily_limit - used)


# ── Definitional-question cache ─────────────────────────────────────────
# Only ever populated/read for questions the domain guard has judged to be
# generic glossary/definition lookups (see domain_guard.is_definitional) —
# never for anything referencing the student's own live calculation
# numbers, which would make a cached answer wrong for the next person.

_WHITESPACE = re.compile(r"\s+")


def cache_key(question: str) -> str:
    normalized = _WHITESPACE.sub(" ", question.strip().lower())
    return hashlib.sha256(normalized.encode("utf-8")).hexdigest()[:32]


def get_cached(question: str) -> Optional[CachedAnswer]:
    key = cache_key(question)
    client = get_client()
    if client is None:
        return _mem_cache.get(key)

    cutoff = datetime.now(timezone.utc).timestamp() - config.CACHE_TTL_DAYS * 86400
    try:
        result = client.table("tutor_cache").select("*").eq("question_key", key).execute()
    except Exception as exc:
        print(f"[tutor] Supabase cache lookup failed, treating as a cache miss: {exc}")
        return None
    if not result.data:
        return None
    row = result.data[0]
    created_at = datetime.fromisoformat(row["created_at"].replace("Z", "+00:00")).timestamp()
    if created_at < cutoff:
        return None
    # Best-effort hit-count bump — never let this fail the request.
    try:
        client.table("tutor_cache").update({"hit_count": row.get("hit_count", 0) + 1}).eq("question_key", key).execute()
    except Exception:
        pass
    return CachedAnswer(row["answer"], row.get("navigation_to"), row.get("navigation_label"))


def put_cached(question: str, page_path: str, answer: str, navigation_to: Optional[str], navigation_label: Optional[str]) -> None:
    key = cache_key(question)
    client = get_client()
    if client is None:
        _mem_cache[key] = CachedAnswer(answer, navigation_to, navigation_label)
        return
    try:
        client.table("tutor_cache").upsert({
            "question_key": key,
            "question": question,
            "page_path": page_path,
            "answer": answer,
            "navigation_to": navigation_to,
            "navigation_label": navigation_label,
            "hit_count": 0,
        }).execute()
    except Exception:
        pass  # caching is an optimization, never worth failing the request over
