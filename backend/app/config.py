"""
Environment-driven configuration.

ALLOWED_ORIGINS: comma-separated list of EXACT frontend origins allowed to
call this API, e.g. "https://your-app.vercel.app,http://localhost:5173". Set
this in Render's dashboard under the backend service's Environment tab. If
unset, defaults to allowing all origins (fine for development, but set it
explicitly in production).

ALLOWED_ORIGIN_REGEX: a regex for origins that should always be allowed
without needing an env var update. Defaults to any Vercel deployment of this
project (production alias, preview URLs, git-branch URLs) — every Vercel
preview build gets a new random hash in its URL
(crane-panel-tool-<hash>-<team>.vercel.app), so an exact-match ALLOWED_ORIGINS
list breaks CORS on every single new deployment unless it's updated by hand
each time. The regex below matches any "crane-panel-tool*.vercel.app"
origin, which only Vercel can issue for this project, so it's safe to allow
broadly. Override via env if the Vercel project is ever renamed.
"""
import os

_raw_origins = os.environ.get("ALLOWED_ORIGINS", "*")
ALLOWED_ORIGINS = ["*"] if _raw_origins.strip() == "*" else [o.strip() for o in _raw_origins.split(",") if o.strip()]

ALLOWED_ORIGIN_REGEX = os.environ.get(
    "ALLOWED_ORIGIN_REGEX",
    r"^https://crane-panel-tool(-[a-zA-Z0-9]+)*\.vercel\.app$",
)
