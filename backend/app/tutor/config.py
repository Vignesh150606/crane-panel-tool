"""
Environment-driven configuration for the Engineering Tutor.

Every value here is read from an environment variable so nothing secret or
deployment-specific is hardcoded. Set these in Render's dashboard under the
backend service's Environment tab (same place ALLOWED_ORIGINS already lives).

Required for the tutor to work at all:
    GEMINI_API_KEY          — from https://aistudio.google.com/app/apikey

Required for real (persistent) rate limiting + caching:
    SUPABASE_URL            — Project Settings → API → Project URL
    SUPABASE_SERVICE_KEY    — Project Settings → API → service_role key
                               (NOT the anon/public key — this runs server-side
                               only and needs to bypass row-level security to
                               write usage counters for anonymous visitors)

If SUPABASE_URL / SUPABASE_SERVICE_KEY are unset, the tutor still runs, but
falls back to an in-memory store (see supabase_store.py) — meaning daily
limits and the answer cache both reset whenever the Render free-tier
instance spins down. That's fine for local dev, not fine for production.
"""
import os

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")

# Check https://ai.google.dev/gemini-api/docs/models for the current
# recommended Flash model — this was accurate as of this feature's build,
# but Google's model lineup moves fast. Override here or via env var
# without touching any other file.
GEMINI_MODEL = os.environ.get("GEMINI_MODEL", "gemini-2.5-flash")

SUPABASE_URL = os.environ.get("SUPABASE_URL", "")
SUPABASE_SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_KEY", "")

# ── Abuse protection ────────────────────────────────────────────────────
# Primary, user-facing limit: per anonymous browser identity.
DAILY_LIMIT_PER_ANON = int(os.environ.get("TUTOR_DAILY_LIMIT_PER_ANON", "10"))

# Coarser ceiling per IP address. Deliberately higher than the per-anon
# limit — a college wifi/hostel NAT can put many genuine students behind
# one IP, so this isn't meant to be the everyday limit anyone hits. It
# exists to cap the damage if someone scripts around the anon-id limit by
# clearing storage / using incognito repeatedly from the same network.
DAILY_LIMIT_PER_IP = int(os.environ.get("TUTOR_DAILY_LIMIT_PER_IP", "60"))

COOLDOWN_SECONDS = int(os.environ.get("TUTOR_COOLDOWN_SECONDS", "15"))
MAX_PROMPT_CHARS = int(os.environ.get("TUTOR_MAX_PROMPT_CHARS", "300"))
MAX_HISTORY_TURNS = int(os.environ.get("TUTOR_MAX_HISTORY_TURNS", "4"))

# How long a cached definitional answer stays valid before being treated as
# stale and regenerated. Handbook content changes rarely, so this is long.
CACHE_TTL_DAYS = int(os.environ.get("TUTOR_CACHE_TTL_DAYS", "30"))

LIMIT_REACHED_MESSAGE = (
    "You have reached today's Engineering Tutor limit. Please continue tomorrow."
)
