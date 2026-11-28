create table if not exists public.diagnostic_events (
  id bigint generated always as identity primary key,
  event_type text not null check (event_type in ('character_audit','validation_blocked','client_error')),
  module text not null check (length(module) between 1 and 80),
  error_code text not null check (length(error_code) between 1 and 100),
  severity text not null check (severity in ('info','warning','error','critical')),
  message text not null default '' check (length(message) <= 500),
  context jsonb not null default '{}'::jsonb check (jsonb_typeof(context) = 'object' and pg_column_size(context) <= 4096),
  app_version text not null default '',
  commit_sha text not null default '',
  test_case_id text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists diagnostic_events_created_at_idx on public.diagnostic_events (created_at desc);
create index if not exists diagnostic_events_code_idx on public.diagnostic_events (error_code, created_at desc);
alter table public.diagnostic_events enable row level security;
drop policy if exists "Anonymous clients may submit sanitized diagnostics" on public.diagnostic_events;
create policy "Anonymous clients may submit sanitized diagnostics"
  on public.diagnostic_events for insert to anon, authenticated
  with check (
    event_type in ('character_audit','validation_blocked','client_error')
    and length(module) between 1 and 80
    and length(error_code) between 1 and 100
    and length(message) <= 500
    and jsonb_typeof(context) = 'object'
    and pg_column_size(context) <= 4096
  );

create table if not exists public.diagnostic_test_runs (
  id uuid primary key default gen_random_uuid(),
  workflow_run_id bigint unique,
  suite text not null,
  status text not null check (status in ('queued','in_progress','success','failure','cancelled','skipped')),
  commit_sha text not null default '',
  summary jsonb not null default '{}'::jsonb check (jsonb_typeof(summary) = 'object'),
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists diagnostic_test_runs_created_at_idx on public.diagnostic_test_runs (created_at desc);
alter table public.diagnostic_test_runs enable row level security;

create table if not exists public.diagnostic_test_results (
  id bigint generated always as identity primary key,
  run_id uuid not null references public.diagnostic_test_runs(id) on delete cascade,
  case_key text not null,
  class_name text not null default '',
  background_name text not null default '',
  species_name text not null default '',
  status text not null check (status in ('passed','failed','warning')),
  errors jsonb not null default '[]'::jsonb check (jsonb_typeof(errors) = 'array'),
  warnings jsonb not null default '[]'::jsonb check (jsonb_typeof(warnings) = 'array'),
  created_at timestamptz not null default now(),
  unique (run_id, case_key)
);
create index if not exists diagnostic_test_results_run_idx on public.diagnostic_test_results (run_id, status);
alter table public.diagnostic_test_results enable row level security;

-- Only the diagnostics Edge Function (service role) can read or write test runs/results.
-- Client-submitted runtime events are insert-only and intentionally contain no character sheet or player identifiers.
