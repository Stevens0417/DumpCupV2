# Database Schema Snapshot (public tables only)

## app_admins

### Columns
user_id uuid
note text
created_at timestamp with time zone

### Primary Key
user_id

### Foreign Keys
(none)

### Indexes
app_admins_pkey

## awards

### Columns
id uuid
season_id uuid
award USER-DEFINED (award_type)
team_id uuid
team_captain text
final_score text
player_id uuid
net_points numeric
notes text
created_at timestamp with time zone
updated_at timestamp with time zone

### Primary Key
id

### Foreign Keys
season_id → seasons.id
player_id → players.id
team_id → teams.id

### Indexes
awards_award_idx
awards_season_idx
awards_pkey

## gallery_images

### Columns
id uuid
season_id uuid
image_url text
thumbnail_url text
position_order integer
caption text
created_at timestamp with time zone
updated_at timestamp with time zone

### Primary Key
id

### Foreign Keys
season_id → seasons.id

### Indexes
gallery_images_pkey
gallery_images_season_idx
gallery_images_order_idx

## match_players

### Columns
id uuid
match_id uuid
player_id uuid
team_id uuid
handicap_used numeric
points_earned numeric
created_at timestamp with time zone
updated_at timestamp with time zone

### Primary Key
id

### Foreign Keys
team_id → teams.id
match_id → matches.id
player_id → players.id

### Indexes
match_players_unique
match_players_team_idx
match_players_player_idx
match_players_match_idx
match_players_pkey

## match_type_allocations

### Columns
id uuid
match_type_id uuid
rank_order integer
percentage_weight numeric
created_at timestamp with time zone
updated_at timestamp with time zone

### Primary Key
id

### Foreign Keys
match_type_id → match_types.id

### Indexes
match_type_alloc_unique
match_type_alloc_match_idx
match_type_allocations_pkey

## match_types

### Columns
id uuid
name text
players_per_team integer
handicap_allowance numeric
notes text
created_at timestamp with time zone
updated_at timestamp with time zone

### Primary Key
id

### Foreign Keys
(none)

### Indexes
match_types_pkey
match_types_name_key

## matches

### Columns
id uuid
season_id uuid
match_date date
holes integer
match_type_id uuid
team_a_id uuid
team_b_id uuid
team_a_handicap integer
team_b_handicap integer
team_a_gross integer
team_b_gross integer
team_a_net integer
team_b_net integer
team_a_points numeric
team_b_points numeric
tournament_id uuid
notes text
created_at timestamp with time zone
updated_at timestamp with time zone
match_points numeric

### Primary Key
id

### Foreign Keys
team_b_id → teams.id
team_a_id → teams.id
tournament_id → tournaments.id
season_id → seasons.id
match_type_id → match_types.id

### Indexes
matches_season_date_idx
matches_tournament_idx
matches_pkey

## players

### Columns
id uuid
full_name text
handicap numeric
is_active boolean
created_at timestamp with time zone
updated_at timestamp with time zone

### Primary Key
id

### Foreign Keys
(none)

### Indexes
players_pkey
players_name_unique
players_active_idx

## rosters

### Columns
id uuid
season_id uuid
team_id uuid
player_id uuid
handicap_at_draft numeric
drafted_at date
effective_from date
effective_to date
is_celebrity boolean
created_at timestamp with time zone
updated_at timestamp with time zone

### Primary Key
id

### Foreign Keys
player_id → players.id
team_id → teams.id
season_id → seasons.id

### Indexes
rosters_team_idx
rosters_season_idx
rosters_pkey
rosters_effective_idx
rosters_player_idx

## seasons

### Columns
id uuid
year integer
created_at timestamp with time zone
updated_at timestamp with time zone

### Primary Key
id

### Foreign Keys
(none)

### Indexes
seasons_pkey
seasons_year_key

## teams

### Columns
id uuid
season_id uuid
name text
captain_name text
color_primary text
color_secondary text
created_at timestamp with time zone
updated_at timestamp with time zone

### Primary Key
id

### Foreign Keys
season_id → seasons.id

### Indexes
teams_season_id_idx
teams_pkey
teams_season_name_unique

## tournament_entries

### Columns
id uuid
tournament_id uuid
player_id uuid
team_id uuid
gross_score integer
handicap_used numeric
net_score integer
finish_position integer
points_awarded numeric
created_at timestamp with time zone
updated_at timestamp with time zone

### Primary Key
id

### Foreign Keys
team_id → teams.id
tournament_id → tournaments.id
player_id → players.id

### Indexes
tournament_entries_pkey
tournament_entries_unique
tournament_entries_tournament_idx
tournament_entries_player_idx

## tournament_position_points

### Columns
id uuid
tournament_id uuid
finish_position integer
points numeric
created_at timestamp with time zone
updated_at timestamp with time zone

### Primary Key
id

### Foreign Keys
tournament_id → tournaments.id

### Indexes
tournament_position_points_tournament_idx
tournament_position_points_pkey
tournament_position_points_unique

## tournaments

### Columns
id uuid
season_id uuid
type USER-DEFINED (tournament_type)
tournament_date date
course text
poster_url text
created_at timestamp with time zone
updated_at timestamp with time zone

### Primary Key
id

### Foreign Keys
season_id → seasons.id

### Indexes
tournaments_unique
tournaments_pkey
tournaments_season_type_idx