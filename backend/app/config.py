"""
Environment-driven configuration.

ALLOWED_ORIGINS: comma-separated list of frontend origins allowed to call this
API, e.g. "https://your-app.vercel.app,http://localhost:5173". Set this in
Render's dashboard under the backend service's Environment tab. If unset,
defaults to allowing all origins (fine for development, but set it explicitly
in production).
"""
import os

_raw_origins = os.environ.get("ALLOWED_ORIGINS", "*")
ALLOWED_ORIGINS = ["*"] if _raw_origins.strip() == "*" else [o.strip() for o in _raw_origins.split(",") if o.strip()]
