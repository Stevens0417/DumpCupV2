-- Set default of 0 for points_awarded so setup inserts (with no results yet) don't require an explicit value.
alter table public.tournament_entries
  alter column points_awarded set default 0;

update public.tournament_entries
set points_awarded = 0
where points_awarded is null;
