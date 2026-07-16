"""
There's no login system in this app, so "a user" for rate-limiting purposes
is two independent signals, combined:

  1. An anonymous client id the frontend generates once (crypto.randomUUID())
     and persists in localStorage, sent as the X-Tutor-Client-Id header.
     This is the primary, user-facing "10 questions today" counter.
     Trivially reset by clearing storage or opening an incognito window —
     that's a known, accepted limitation of not having real accounts.

  2. The request's IP address, extracted the way Render's proxy actually
     presents it (X-Forwarded-For, left-most entry = the original client).
     This is a coarser, higher-ceiling backstop — see config.py for why
     it's set well above the per-anon limit.

Both are checked; a request is blocked if *either* has hit its daily cap.
Never trust the frontend to self-report either value honestly beyond the
anon id (which is just a bucket key, not a security boundary) — the IP is
read server-side from the connection/proxy headers only.
"""
from fastapi import Request

ANON_HEADER = "x-tutor-client-id"


def get_ip(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        # Left-most entry is the original client; the rest are proxy hops.
        return forwarded.split(",")[0].strip()
    if request.client:
        return request.client.host
    return "unknown"


def get_anon_id(request: Request) -> str:
    anon_id = request.headers.get(ANON_HEADER, "").strip()
    # Fall back to "no-id" rather than None so it still buckets consistently
    # (and gets caught by the IP-level limit) if a client ever omits the header.
    return anon_id[:64] if anon_id else "no-id"
