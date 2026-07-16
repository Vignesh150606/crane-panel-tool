-- Engineering Tutor persistence — run this once in your Supabase project's
-- SQL editor (Project → SQL Editor → New query → paste → Run).
--
-- Two tables:
--   tutor_usage  — one row per (client_key, day). client_key is either
--                  "anon:<uuid>" (the frontend's per-browser id) or
--                  "ip:<address>" (the coarser backstop). See
--                  backend/app/tutor/identity.py for how both are derived.
--   tutor_cache  — answers to generic, definitional questions ("What is
--                  KM1?"), keyed by a hash of the normalized question text.
--                  Never populated for context-specific questions — see
--                  backend/app/tutor/domain_guard.py::is_definitional.
--
-- Both are written only by the backend's service_role key, never by the
-- frontend directly, so Row Level Security is left ON with no policies —
-- the service_role key bypasses RLS by design, and this keeps the tables
-- unreachable from the anon/public key if one is ever added to this
-- project for something else later.

create table if not exists tutor_usage (
  client_key text not null,
  usage_date date not null,
  count integer not null default 0,
  last_request_at timestamptz,
  primary key (client_key, usage_date)
);

alter table tutor_usage enable row level security;

create table if not exists tutor_cache (
  question_key text primary key,
  question text not null,
  page_path text,
  answer text not null,
  navigation_to text,
  navigation_label text,
  hit_count integer not null default 0,
  created_at timestamptz not null default now()
);

alter table tutor_cache enable row level security;

-- Housekeeping index: lets you glance at cache hit rates / prune cold
-- entries later without a full table scan. Not required for correctness.
create index if not exists tutor_cache_created_at_idx on tutor_cache (created_at);

-- Atomic "check cooldown + daily limit, then increment" in one round trip,
-- so two near-simultaneous requests from the same identity can't both read
-- "9 used" and both slip through as the 10th. `for update` row-locks the
-- existing row (if any) for the duration of the transaction.
create or replace function tutor_usage_try_consume(
  p_client_key text,
  p_daily_limit integer,
  p_cooldown_seconds integer
) returns table(allowed boolean, reason text, count integer, retry_after_seconds integer)
language plpgsql
as $$
declare
  v_today date := (now() at time zone 'utc')::date;
  v_row tutor_usage%rowtype;
  v_seconds_since_last numeric;
begin
  select * into v_row from tutor_usage
    where client_key = p_client_key and usage_date = v_today
    for update;

  if found then
    if p_cooldown_seconds > 0 and v_row.last_request_at is not null then
      v_seconds_since_last := extract(epoch from (now() - v_row.last_request_at));
      if v_seconds_since_last < p_cooldown_seconds then
        return query select false, 'cooldown'::text, v_row.count,
          ceil(p_cooldown_seconds - v_seconds_since_last)::integer;
        return;
      end if;
    end if;

    if v_row.count >= p_daily_limit then
      return query select false, 'daily_limit'::text, v_row.count, null::integer;
      return;
    end if;

    update tutor_usage set count = count + 1, last_request_at = now()
      where client_key = p_client_key and usage_date = v_today
      returning count into v_row.count;

    return query select true, null::text, v_row.count, null::integer;
  else
    insert into tutor_usage (client_key, usage_date, count, last_request_at)
      values (p_client_key, v_today, 1, now());
    return query select true, null::text, 1, null::integer;
  end if;
end;
$$;

-- Optional housekeeping: usage rows older than a few days are useless once
-- their day has passed (the app only ever queries "today"). Uncomment and
-- schedule via Supabase's pg_cron extension if you want automatic cleanup
-- instead of letting the table grow indefinitely:
--
-- select cron.schedule('tutor-usage-cleanup', '0 3 * * *',
--   $$delete from tutor_usage where usage_date < (now() - interval '7 days')::date$$);
