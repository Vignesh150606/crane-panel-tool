# Deployment Guide

Three services, all with usable free tiers: **Vercel** (frontend),
**Render** (backend), **Supabase** (tutor persistence — new in V3). Plus a
**Gemini API key** for the tutor.

## 1. Backend — Render

1. New Web Service → connect this repo → root directory `backend/`.
2. Build command: `pip install -r requirements.txt`. Start command:
   `uvicorn app.main:app --host 0.0.0.0 --port $PORT`.
3. Environment tab — set:
   - `ALLOWED_ORIGINS` — your Vercel URL(s), comma-separated (e.g.
     `https://your-app.vercel.app`). Defaults to `*` if unset, which works
     but is worth locking down once you have a stable frontend URL.
   - `GEMINI_API_KEY` — from https://aistudio.google.com/app/apikey.
   - `SUPABASE_URL`, `SUPABASE_SERVICE_KEY` — see step 2.
   - Optional tuning vars (`TUTOR_DAILY_LIMIT_PER_ANON`, etc.) — see
     `backend/.env.example` for the full list and defaults.
4. Deploy. Note the URL (`https://your-app.onrender.com`).

**Free-tier caveat**: Render's free web services spin down after a period
of inactivity and take 30-50s to wake on the next request. The frontend's
API client already accounts for this (a longer timeout + a friendly "waking
up" error message rather than a raw failure) — see `frontend/src/api/client.js`.
This is also *why* the tutor's rate limiting and cache live in Supabase
instead of in-memory: in-memory state wouldn't survive a spin-down.

## 2. Tutor persistence — Supabase

1. Create a project at https://supabase.com (or reuse an existing one).
2. SQL Editor → New query → paste the contents of
   `backend/supabase/schema.sql` → Run. This creates `tutor_usage`,
   `tutor_cache`, and the `tutor_usage_try_consume()` function the rate
   limiter calls.
3. Project Settings → API → copy the **Project URL** (→
   `SUPABASE_URL`) and the **service_role** key, not the anon/public one (→
   `SUPABASE_SERVICE_KEY`). The service role key is required because the
   backend writes usage counters for anonymous visitors and needs to bypass
   Row Level Security to do it — RLS is left enabled on both tables with no
   policies, so the anon/public key can't touch them at all even if one
   gets added to this project for something else later.

If you skip this step entirely, the tutor still runs — it falls back to
in-memory storage (see `backend/app/tutor/store.py`), which is fine for
local development but means daily limits and the cache reset on every
backend restart in production.

## 3. Frontend — Vercel

1. New Project → connect this repo → root directory `frontend/`.
2. Framework preset: Vite. Build command `npm run build`, output
   directory `dist`.
3. Environment Variables → `VITE_API_URL` = your Render backend URL from
   step 1 (e.g. `https://your-app.onrender.com`, no trailing slash).
4. Deploy.

## 4. Verify

- Open the deployed frontend → run a calculation on Load Calculator →
  confirms the frontend/backend connection.
- Open the Engineering Tutor panel → ask a question → confirms
  Gemini + Supabase are wired correctly. If you see "The Engineering Tutor
  isn't configured yet" (`503`), double check `GEMINI_API_KEY` on Render. If
  questions don't seem to persist a daily count across a page refresh,
  double-check the Supabase env vars and that `schema.sql` actually ran.
- This project was built and tested (backend unit tests, frontend build/lint,
  SSR smoke test across all 18 pages, and a scripted Playwright walkthrough)
  in a sandbox with no route to Google's or Supabase's APIs — the Gemini and
  Supabase integration code is verified against the actual SDKs'
  documented/introspected behavior, but a real end-to-end request has not
  been made. Do one real question after deploying to confirm the full round
  trip.

## Local development

```bash
# Backend
cd backend
python -m venv venv && source venv/bin/activate   # or venv\Scripts\activate on Windows
pip install -r requirements.txt
cp .env.example .env   # fill in GEMINI_API_KEY / SUPABASE_* if you want the tutor working locally
uvicorn app.main:app --reload

# Frontend
cd frontend
npm install
npm run dev   # defaults to http://localhost:8000 for the backend if VITE_API_URL isn't set
```
