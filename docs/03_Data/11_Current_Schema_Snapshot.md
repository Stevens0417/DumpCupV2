# Current Schema Snapshot (public)

## app_admins

### Columns
user_id uuid not null
note text
created_at timestamptz not null default now()

### Constraints
CHECK: 2200_17475_1_not_null
CHECK: 2200_17475_3_not_null
PRIMARY KEY: app_admins_pkey (user_id)

### Indexes
CREATE UNIQUE INDEX app_admins_pkey ON public.app_admins USING btree (user_id)

### RLS
rls_enabled=t; rls_forced=f

### Policies
Admins can manage admins | cmd=ALL | roles=authenticated | using=is_admin() | with_check=is_admin()
Admins can read admins | cmd=SELECT | roles=authenticated | using=is_admin() | with_check=(none)

### Triggers
(none)

## awards

### Columns
id uuid not null default gen_random_uuid()
season_id uuid not null
award award_type not null
team_id uuid
team_captain text
final_score text
player_id uuid
net_points numeric
notes text
created_at timestamptz not null default now()
updated_at timestamptz not null default now()

### Constraints
CHECK: 2200_17732_10_not_null
CHECK: 2200_17732_11_not_null
CHECK: 2200_17732_1_not_null
CHECK: 2200_17732_2_not_null
CHECK: 2200_17732_3_not_null
CHECK: awards_logic_chk
FOREIGN KEY: awards_player_id_fkey (player_id) -> players(id)
FOREIGN KEY: awards_season_id_fkey (season_id) -> seasons(id)
FOREIGN KEY: awards_team_id_fkey (team_id) -> teams(id)
PRIMARY KEY: awards_pkey (id)

### Indexes
CREATE INDEX awards_award_idx ON public.awards USING btree (award)
CREATE UNIQUE INDEX awards_pkey ON public.awards USING btree (id)
CREATE INDEX awards_season_idx ON public.awards USING btree (season_id)

### RLS
rls_enabled=t; rls_forced=f

### Policies
Admins can write awards | cmd=ALL | roles=authenticated | using=is_admin() | with_check=is_admin()
Public can read awards | cmd=SELECT | roles=anon,authenticated | using=true | with_check=(none)

### Triggers
awards_set_updated_at | BEFORE UPDATE | EXECUTE FUNCTION set_updated_at()

## gallery_images

### Columns
id uuid not null default gen_random_uuid()
season_id uuid
image_url text not null
thumbnail_url text not null
position_order int4 not null default 0
caption text
created_at timestamptz not null default now()
updated_at timestamptz not null default now()

### Constraints
CHECK: 2200_17761_1_not_null
CHECK: 2200_17761_3_not_null
CHECK: 2200_17761_4_not_null
CHECK: 2200_17761_5_not_null
CHECK: 2200_17761_7_not_null
CHECK: 2200_17761_8_not_null
FOREIGN KEY: gallery_images_season_id_fkey (season_id) -> seasons(id)
PRIMARY KEY: gallery_images_pkey (id)

### Indexes
CREATE INDEX gallery_images_order_idx ON public.gallery_images USING btree (position_order DESC, created_at DESC)
CREATE UNIQUE INDEX gallery_images_pkey ON public.gallery_images USING btree (id)
CREATE INDEX gallery_images_season_idx ON public.gallery_images USING btree (season_id)

### RLS
rls_enabled=t; rls_forced=f

### Policies
Admins can write gallery images | cmd=ALL | roles=authenticated | using=is_admin() | with_check=is_admin()
Public can read gallery images | cmd=SELECT | roles=anon,authenticated | using=true | with_check=(none)

### Triggers
gallery_images_set_updated_at | BEFORE UPDATE | EXECUTE FUNCTION set_updated_at()

## match_players

### Columns
id uuid not null default gen_random_uuid()
match_id uuid not null
player_id uuid not null
team_id uuid not null
handicap_used numeric
points_earned numeric not null default 0
created_at timestamptz not null default now()
updated_at timestamptz not null default now()

### Constraints
CHECK: 2200_17632_1_not_null
CHECK: 2200_17632_2_not_null
CHECK: 2200_17632_3_not_null
CHECK: 2200_17632_4_not_null
CHECK: 2200_17632_6_not_null
CHECK: 2200_17632_7_not_null
CHECK: 2200_17632_8_not_null
FOREIGN KEY: match_players_match_id_fkey (match_id) -> matches(id)
FOREIGN KEY: match_players_player_id_fkey (player_id) -> players(id)
FOREIGN KEY: match_players_team_id_fkey (team_id) -> teams(id)
PRIMARY KEY: match_players_pkey (id)
UNIQUE: match_players_unique (match_id, player_id)

### Indexes
CREATE INDEX match_players_match_idx ON public.match_players USING btree (match_id)
CREATE UNIQUE INDEX match_players_pkey ON public.match_players USING btree (id)
CREATE INDEX match_players_player_idx ON public.match_players USING btree (player_id)
CREATE INDEX match_players_team_idx ON public.match_players USING btree (team_id)
CREATE UNIQUE INDEX match_players_unique ON public.match_players USING btree (match_id, player_id)

### RLS
rls_enabled=t; rls_forced=f

### Policies
Admins can write match players | cmd=ALL | roles=authenticated | using=is_admin() | with_check=is_admin()
Public can read match players | cmd=SELECT | roles=anon,authenticated | using=true | with_check=(none)

### Triggers
match_players_set_updated_at | BEFORE UPDATE | EXECUTE FUNCTION set_updated_at()

## match_type_allocations

### Columns
id uuid not null default gen_random_uuid()
match_type_id uuid not null
rank_order int4 not null
percentage_weight numeric not null
created_at timestamptz not null default now()
updated_at timestamptz not null default now()

### Constraints
CHECK: 2200_17576_1_not_null
CHECK: 2200_17576_2_not_null
CHECK: 2200_17576_3_not_null
CHECK: 2200_17576_4_not_null
CHECK: 2200_17576_5_not_null
CHECK: 2200_17576_6_not_null
CHECK: match_type_allocations_percentage_weight_check
CHECK: match_type_allocations_rank_order_check
FOREIGN KEY: match_type_allocations_match_type_id_fkey (match_type_id) -> match_types(id)
PRIMARY KEY: match_type_allocations_pkey (id)
UNIQUE: match_type_alloc_unique (match_type_id, rank_order)

### Indexes
CREATE INDEX match_type_alloc_match_idx ON public.match_type_allocations USING btree (match_type_id)
CREATE UNIQUE INDEX match_type_alloc_unique ON public.match_type_allocations USING btree (match_type_id, rank_order)
CREATE UNIQUE INDEX match_type_allocations_pkey ON public.match_type_allocations USING btree (id)

### RLS
rls_enabled=t; rls_forced=f

### Policies
Admins can write match type allocations | cmd=ALL | roles=authenticated | using=is_admin() | with_check=is_admin()
Public can read match type allocations | cmd=SELECT | roles=anon,authenticated | using=true | with_check=(none)

### Triggers
match_type_allocations_set_updated_at | BEFORE UPDATE | EXECUTE FUNCTION set_updated_at()

## match_types

### Columns
id uuid not null default gen_random_uuid()
name text not null
players_per_team int4 not null
handicap_allowance numeric not null default 1.0
notes text
created_at timestamptz not null default now()
updated_at timestamptz not null default now()

### Constraints
CHECK: 2200_17560_1_not_null
CHECK: 2200_17560_2_not_null
CHECK: 2200_17560_3_not_null
CHECK: 2200_17560_4_not_null
CHECK: 2200_17560_6_not_null
CHECK: 2200_17560_7_not_null
CHECK: match_types_handicap_allowance_check
CHECK: match_types_players_per_team_check
PRIMARY KEY: match_types_pkey (id)
UNIQUE: match_types_name_key (name)

### Indexes
CREATE UNIQUE INDEX match_types_name_key ON public.match_types USING btree (name)
CREATE UNIQUE INDEX match_types_pkey ON public.match_types USING btree (id)

### RLS
rls_enabled=t; rls_forced=f

### Policies
Admins can write match types | cmd=ALL | roles=authenticated | using=is_admin() | with_check=is_admin()
Public can read match types | cmd=SELECT | roles=anon,authenticated | using=true | with_check=(none)

### Triggers
match_types_set_updated_at | BEFORE UPDATE | EXECUTE FUNCTION set_updated_at()

## matches

### Columns
id uuid not null default gen_random_uuid()
season_id uuid not null
match_date date not null
holes int4 not null
match_type_id uuid not null
team_a_id uuid not null
team_b_id uuid not null
team_a_handicap int4
team_b_handicap int4
team_a_gross int4
team_b_gross int4
team_a_net int4
team_b_net int4
team_a_points numeric not null default 0
team_b_points numeric not null default 0
tournament_id uuid
notes text
created_at timestamptz not null default now()
updated_at timestamptz not null default now()

### Constraints
CHECK: 2200_17595_14_not_null
CHECK: 2200_17595_15_not_null
CHECK: 2200_17595_18_not_null
CHECK: 2200_17595_19_not_null
CHECK: 2200_17595_1_not_null
CHECK: 2200_17595_2_not_null
CHECK: 2200_17595_3_not_null
CHECK: 2200_17595_4_not_null
CHECK: 2200_17595_5_not_null
CHECK: 2200_17595_6_not_null
CHECK: 2200_17595_7_not_null
CHECK: matches_holes_check
CHECK: matches_team_distinct_chk
FOREIGN KEY: matches_match_type_id_fkey (match_type_id) -> match_types(id)
FOREIGN KEY: matches_season_id_fkey (season_id) -> seasons(id)
FOREIGN KEY: matches_team_a_id_fkey (team_a_id) -> teams(id)
FOREIGN KEY: matches_team_b_id_fkey (team_b_id) -> teams(id)
FOREIGN KEY: matches_tournament_fk (tournament_id) -> tournaments(id)
PRIMARY KEY: matches_pkey (id)

### Indexes
CREATE UNIQUE INDEX matches_pkey ON public.matches USING btree (id)
CREATE INDEX matches_season_date_idx ON public.matches USING btree (season_id, match_date DESC)
CREATE INDEX matches_tournament_idx ON public.matches USING btree (tournament_id)

### RLS
rls_enabled=t; rls_forced=f

### Policies
Admins can write matches | cmd=ALL | roles=authenticated | using=is_admin() | with_check=is_admin()
Public can read matches | cmd=SELECT | roles=anon,authenticated | using=true | with_check=(none)

### Triggers
matches_set_updated_at | BEFORE UPDATE | EXECUTE FUNCTION set_updated_at()

## players

### Columns
id uuid not null default gen_random_uuid()
full_name text not null
handicap numeric not null default 0
is_active bool not null default true
created_at timestamptz not null default now()
updated_at timestamptz not null default now()

### Constraints
CHECK: 2200_17514_1_not_null
CHECK: 2200_17514_2_not_null
CHECK: 2200_17514_3_not_null
CHECK: 2200_17514_4_not_null
CHECK: 2200_17514_5_not_null
CHECK: 2200_17514_6_not_null
PRIMARY KEY: players_pkey (id)
UNIQUE: players_name_unique (full_name)

### Indexes
CREATE INDEX players_active_idx ON public.players USING btree (is_active)
CREATE UNIQUE INDEX players_name_unique ON public.players USING btree (full_name)
CREATE UNIQUE INDEX players_pkey ON public.players USING btree (id)

### RLS
rls_enabled=t; rls_forced=f

### Policies
Admins can write players | cmd=ALL | roles=authenticated | using=is_admin() | with_check=is_admin()
Public can read players | cmd=SELECT | roles=anon,authenticated | using=true | with_check=(none)

### Triggers
players_set_updated_at | BEFORE UPDATE | EXECUTE FUNCTION set_updated_at()

## rosters

### Columns
id uuid not null default gen_random_uuid()
season_id uuid not null
team_id uuid not null
player_id uuid not null
handicap_at_draft numeric
drafted_at date
effective_from date not null
effective_to date
is_celebrity bool not null default false
created_at timestamptz not null default now()
updated_at timestamptz not null default now()

### Constraints
CHECK: 2200_17530_10_not_null
CHECK: 2200_17530_11_not_null
CHECK: 2200_17530_1_not_null
CHECK: 2200_17530_2_not_null
CHECK: 2200_17530_3_not_null
CHECK: 2200_17530_4_not_null
CHECK: 2200_17530_7_not_null
CHECK: 2200_17530_9_not_null
CHECK: rosters_effective_range_chk
FOREIGN KEY: rosters_player_id_fkey (player_id) -> players(id)
FOREIGN KEY: rosters_season_id_fkey (season_id) -> seasons(id)
FOREIGN KEY: rosters_team_id_fkey (team_id) -> teams(id)
PRIMARY KEY: rosters_pkey (id)

### Indexes
CREATE INDEX rosters_effective_idx ON public.rosters USING btree (season_id, player_id, effective_from, effective_to)
CREATE UNIQUE INDEX rosters_pkey ON public.rosters USING btree (id)
CREATE INDEX rosters_player_idx ON public.rosters USING btree (player_id)
CREATE INDEX rosters_season_idx ON public.rosters USING btree (season_id)
CREATE INDEX rosters_team_idx ON public.rosters USING btree (team_id)

### RLS
rls_enabled=t; rls_forced=f

### Policies
Admins can write rosters | cmd=ALL | roles=authenticated | using=is_admin() | with_check=is_admin()
Public can read rosters | cmd=SELECT | roles=anon,authenticated | using=true | with_check=(none)

### Triggers
rosters_set_updated_at | BEFORE UPDATE | EXECUTE FUNCTION set_updated_at()

## seasons

### Columns
id uuid not null default gen_random_uuid()
year int4 not null
created_at timestamptz not null default now()
updated_at timestamptz not null default now()

### Constraints
CHECK: 2200_17484_1_not_null
CHECK: 2200_17484_2_not_null
CHECK: 2200_17484_3_not_null
CHECK: 2200_17484_4_not_null
PRIMARY KEY: seasons_pkey (id)
UNIQUE: seasons_year_key (year)

### Indexes
CREATE UNIQUE INDEX seasons_pkey ON public.seasons USING btree (id)
CREATE UNIQUE INDEX seasons_year_key ON public.seasons USING btree (year)

### RLS
rls_enabled=t; rls_forced=f

### Policies
Admins can write seasons | cmd=ALL | roles=authenticated | using=is_admin() | with_check=is_admin()
Public can read seasons | cmd=SELECT | roles=anon,authenticated | using=true | with_check=(none)

### Triggers
seasons_set_updated_at | BEFORE UPDATE | EXECUTE FUNCTION set_updated_at()

## teams

### Columns
id uuid not null default gen_random_uuid()
season_id uuid not null
name text not null
captain_name text
color_primary text
color_secondary text
created_at timestamptz not null default now()
updated_at timestamptz not null default now()

### Constraints
CHECK: 2200_17495_1_not_null
CHECK: 2200_17495_2_not_null
CHECK: 2200_17495_3_not_null
CHECK: 2200_17495_7_not_null
CHECK: 2200_17495_8_not_null
FOREIGN KEY: teams_season_id_fkey (season_id) -> seasons(id)
PRIMARY KEY: teams_pkey (id)
UNIQUE: teams_season_name_unique (season_id, name)

### Indexes
CREATE UNIQUE INDEX teams_pkey ON public.teams USING btree (id)
CREATE INDEX teams_season_id_idx ON public.teams USING btree (season_id)
CREATE UNIQUE INDEX teams_season_name_unique ON public.teams USING btree (season_id, name)

### RLS
rls_enabled=t; rls_forced=f

### Policies
Admins can write teams | cmd=ALL | roles=authenticated | using=is_admin() | with_check=is_admin()
Public can read teams | cmd=SELECT | roles=anon,authenticated | using=true | with_check=(none)

### Triggers
teams_set_updated_at | BEFORE UPDATE | EXECUTE FUNCTION set_updated_at()

## tournament_entries

### Columns
id uuid not null default gen_random_uuid()
tournament_id uuid not null
player_id uuid not null
team_id uuid not null
gross_score int4
handicap_used numeric
net_score int4
finish_position int4
points_awarded numeric not null default 0
created_at timestamptz not null default now()
updated_at timestamptz not null default now()

### Constraints
CHECK: 2200_17686_10_not_null
CHECK: 2200_17686_11_not_null
CHECK: 2200_17686_1_not_null
CHECK: 2200_17686_2_not_null
CHECK: 2200_17686_3_not_null
CHECK: 2200_17686_4_not_null
CHECK: 2200_17686_9_not_null
FOREIGN KEY: tournament_entries_player_id_fkey (player_id) -> players(id)
FOREIGN KEY: tournament_entries_team_id_fkey (team_id) -> teams(id)
FOREIGN KEY: tournament_entries_tournament_id_fkey (tournament_id) -> tournaments(id)
PRIMARY KEY: tournament_entries_pkey (id)
UNIQUE: tournament_entries_unique (tournament_id, player_id)

### Indexes
CREATE UNIQUE INDEX tournament_entries_pkey ON public.tournament_entries USING btree (id)
CREATE INDEX tournament_entries_player_idx ON public.tournament_entries USING btree (player_id)
CREATE INDEX tournament_entries_tournament_idx ON public.tournament_entries USING btree (tournament_id)
CREATE UNIQUE INDEX tournament_entries_unique ON public.tournament_entries USING btree (tournament_id, player_id)

### RLS
rls_enabled=t; rls_forced=f

### Policies
Admins can write tournament entries | cmd=ALL | roles=authenticated | using=is_admin() | with_check=is_admin()
Public can read tournament entries | cmd=SELECT | roles=anon,authenticated | using=true | with_check=(none)

### Triggers
tournament_entries_set_updated_at | BEFORE UPDATE | EXECUTE FUNCTION set_updated_at()

## tournament_position_points

### Columns
id uuid not null default gen_random_uuid()
tournament_id uuid not null
finish_position int4 not null
points numeric not null
created_at timestamptz not null default now()
updated_at timestamptz not null default now()

### Constraints
CHECK: 2200_17715_1_not_null
CHECK: 2200_17715_2_not_null
CHECK: 2200_17715_3_not_null
CHECK: 2200_17715_4_not_null
CHECK: 2200_17715_5_not_null
CHECK: 2200_17715_6_not_null
FOREIGN KEY: tournament_position_points_tournament_id_fkey (tournament_id) -> tournaments(id)
PRIMARY KEY: tournament_position_points_pkey (id)
UNIQUE: tournament_position_points_unique (tournament_id, finish_position)

### Indexes
CREATE UNIQUE INDEX tournament_position_points_pkey ON public.tournament_position_points USING btree (id)
CREATE INDEX tournament_position_points_tournament_idx ON public.tournament_position_points USING btree (tournament_id)
CREATE UNIQUE INDEX tournament_position_points_unique ON public.tournament_position_points USING btree (tournament_id, finish_position)

### RLS
rls_enabled=t; rls_forced=f

### Policies
Admins can write tournament position points | cmd=ALL | roles=authenticated | using=is_admin() | with_check=is_admin()
Public can read tournament position points | cmd=SELECT | roles=anon,authenticated | using=true | with_check=(none)

### Triggers
tournament_position_points_set_updated_at | BEFORE UPDATE | EXECUTE FUNCTION set_updated_at()

## tournaments

### Columns
id uuid not null default gen_random_uuid()
season_id uuid not null
type tournament_type not null
tournament_date date not null
course text
poster_url text
created_at timestamptz not null default now()
updated_at timestamptz not null default now()

### Constraints
CHECK: 2200_17662_1_not_null
CHECK: 2200_17662_2_not_null
CHECK: 2200_17662_3_not_null
CHECK: 2200_17662_4_not_null
CHECK: 2200_17662_7_not_null
CHECK: 2200_17662_8_not_null
FOREIGN KEY: tournaments_season_id_fkey (season_id) -> seasons(id)
PRIMARY KEY: tournaments_pkey (id)
UNIQUE: tournaments_unique (season_id, type)

### Indexes
CREATE UNIQUE INDEX tournaments_pkey ON public.tournaments USING btree (id)
CREATE INDEX tournaments_season_type_idx ON public.tournaments USING btree (season_id, type)
CREATE UNIQUE INDEX tournaments_unique ON public.tournaments USING btree (season_id, type)

### RLS
rls_enabled=t; rls_forced=f

### Policies
Admins can write tournaments | cmd=ALL | roles=authenticated | using=is_admin() | with_check=is_admin()
Public can read tournaments | cmd=SELECT | roles=anon,authenticated | using=true | with_check=(none)

### Triggers
tournaments_set_updated_at | BEFORE UPDATE | EXECUTE FUNCTION set_updated_at()


## Enums

- award_type: league_winner, mvp, most_unimproved, most_improved, low_gross, low_net, other
- tournament_type: kickoff, midseason, yearend
