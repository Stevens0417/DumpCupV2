alter table public.tournaments
add column if not exists status text not null default 'setup';
