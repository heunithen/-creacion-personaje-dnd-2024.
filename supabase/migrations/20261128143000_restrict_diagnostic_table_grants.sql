revoke all on table public.diagnostic_events from anon, authenticated;
grant insert on table public.diagnostic_events to anon, authenticated;
grant usage on sequence public.diagnostic_events_id_seq to anon, authenticated;

revoke all on table public.diagnostic_test_runs from anon, authenticated;
revoke all on table public.diagnostic_test_results from anon, authenticated;
