"""
Lazy Supabase client. Returns None (rather than raising) when
SUPABASE_URL / SUPABASE_SERVICE_KEY aren't set, so the rest of the tutor
module can fall back to in-memory storage for local dev — see store.py.
"""
from functools import lru_cache

from app.tutor import config


@lru_cache
def get_client():
    if not (config.SUPABASE_URL and config.SUPABASE_SERVICE_KEY):
        return None
    from supabase import create_client  # imported lazily — optional dependency
    return create_client(config.SUPABASE_URL, config.SUPABASE_SERVICE_KEY)
