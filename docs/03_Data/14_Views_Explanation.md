# Dump Cup V2 — Frontend Views Guide

## Purpose

This document explains the current public-facing SQL views and how the frontend should use them.

These views are the canonical read layer for the public UI.  
The frontend should prefer views over raw tables whenever possible.

## Frontend Rule

Claude must follow these rules when building the frontend:

1. Use these views for public pages.
2. Do not query raw write tables directly in public pages unless a required view does not exist.
3. Keep frontend logic light.
4. Let SQL views do the aggregation and shaping.
5. Public pages should mostly:
   - fetch view rows
   - filter by season/tournament where needed
   - render UI

---

# View Inventory

## 1) `public.v_team_season_scores`

### Purpose
Used for the main scoreboard totals by season.

### Returns
- `season_id`
- `season_year`
- `team_id`
- `team_name`
- `total_points`

### What it includes
- Regular match points
- Tournament points
- Combined team total for each season

### Frontend Usage
Use this for:
- main scoreboard totals
- season toggle scoreboard
- top-level team score display

### Recommended Query Pattern
- filter by selected season
- default to latest season if no season selected

### Example UI Usage
- Home / Scoreboard page
- “Team Dresden: 21 pts”
- “Team York: 18 pts”

---

## 2) `public.v_player_season_net_points`

### Purpose
Used for player leaderboard and stats ranking.

### Returns
- `season_id`
- `season_year`
- `player_id`
- `player_name`
- `points_won`
- `points_lost`
- `net_points`

### What it includes
- Match points won
- Tournament points won
- Match points lost
- Net points = won - lost

### Frontend Usage
Use this for:
- player standings
- season player leaderboard
- stats page ranking tables

### Recommended Query Pattern
- filter by selected season
- sort by `net_points desc`

### Example UI Usage
- Stats page leaderboard
- “Top Net Points”
- “Points Won / Lost / Net”

---

## 3) `public.v_team_score_progression_weekly`

### Purpose
Used for the cumulative team score line chart over the season.

### Returns
- `season_id`
- `season_year`
- `team_id`
- `team_name`
- `week_start`
- `points_delta`
- `cumulative_points`

### What it includes
- Weekly grouped scoring changes
- Running cumulative points by team

### Frontend Usage
Use this for:
- main chart showing season race progression
- chart where users see when one team took the lead

### Recommended Query Pattern
- filter by selected season
- group rows by `team_name`
- x-axis = `week_start`
- y-axis = `cumulative_points`

### Example UI Usage
- Score progression chart on homepage
- line graph like “Dresden vs York over season”

### Notes
This is the preferred chart view over the daily version because it is cleaner and easier to display.

---

## 4) `public.v_latest_match_snapshot`

### Purpose
Used for the “Latest Match” section on the homepage or scoreboard page.

### Returns
One row per player in the most recent match of each season.

### Returns fields
- season info
- match info
- match type
- player
- team
- `handicap_used`
- `points_earned`
- `team_gross_score`
- `team_net_score`
- `team_points`
- `result`

### What it includes
- latest match only
- all players in that match
- team scores and player points for that match

### Frontend Usage
Use this for:
- latest match card
- “Last Match Results”
- player rows under each team in the latest match summary

### Recommended Query Pattern
- filter by selected season
- group by `team_name`

### Example UI Usage
- Latest match result block on home page
- show:
  - match type
  - team gross/net
  - player names
  - points earned

### Important Note
This view shows team gross/net, not individual player gross/net, because match tables store team scores for regular match records.

---

## 5) `public.v_awards_history`

### Purpose
Used for the awards/history page.

### Returns
- `award_id`
- `season_id`
- `season_year`
- `award`
- `player_id`
- `player_name`
- `team_id`
- `team_name`
- `team_captain`
- `final_score`
- `net_points`
- `notes`
- `created_at`

### Frontend Usage
Use this for:
- awards page
- history page award sections
- all-time award list

### Recommended Query Pattern
- usually no season filter required
- can optionally filter by season if desired

### Example UI Usage
- “MVP — John Smith — 2025”
- “League Winner — Team Dresden — 2024”

---

## 6) `public.v_team_rosters_display`

### Purpose
Used for showing each team’s players on the main page or roster sections.

### Returns
- `season_id`
- `season_year`
- `team_id`
- `team_name`
- `captain_name`
- `player_id`
- `player_name`
- `player_handicap`
- `is_captain`
- `display_group`
- `display_order`

### What it includes
- active roster rows only
- captain first
- remaining players sorted by lowest handicap first

### Frontend Usage
Use this for:
- homepage team roster display
- roster list below each team logo

### Recommended Query Pattern
- filter by selected season
- order by `team_name`, then `display_order`

### Example UI Usage
Under each team logo:
- captain at top
- rest of players listed below

---

## 7) `public.v_gallery_images`

### Purpose
Used for the gallery page.

### Returns
- `gallery_image_id`
- `season_id`
- `season_year`
- `image_url`
- `thumbnail_url`
- `position_order`
- `caption`
- `created_at`
- `updated_at`

### Frontend Usage
Use this for:
- gallery page
- season-filtered gallery display
- image grid / lightbox gallery

### Recommended Query Pattern
- optionally filter by season
- order by `position_order asc`, then `created_at desc`

### Example UI Usage
- full gallery page
- season-specific photo gallery

---

# Tournament Views

Tournament UI should use multiple views depending on tournament type.

---

## 8) `public.v_tournament_summary`

### Purpose
Used for tournament header and overall team points gained in the tournament.

### Returns
- `tournament_id`
- `season_id`
- `season_year`
- `tournament_type`
- `tournament_date`
- `course`
- `poster_url`
- `team_id`
- `team_name`
- `team_points`

### What it includes
- one row per team in each tournament
- team totals for that tournament
- poster and tournament metadata

### Frontend Usage
Use this for:
- tournament page header
- tournament poster
- tournament team totals section

### Recommended Query Pattern
- filter by selected season and selected tournament type

### Example UI Usage
Top of tournament page:
- poster
- date
- course
- Team Dresden: +8
- Team York: +4

---

## 9) `public.v_kickoff_results`

### Purpose
Used only for the Kickoff tournament results table.

### Returns
- tournament info
- player info
- team info
- gross score
- handicap used
- net score
- finish position
- points awarded
- display rank

### What it includes
- player medal standings
- sorted by lowest net score

### Frontend Usage
Use this for:
- kickoff results table only

### Recommended Query Pattern
- filter by selected season and `tournament_type = 'kickoff'`
- order by `display_rank`

### Example UI Usage
Kickoff results page/table:
- Player
- Team
- Gross
- Handicap
- Net
- Position
- Points

---

## 10) `public.v_tournament_match_results`

### Purpose
Used for Midseason and Yearend tournament match summaries.

### Returns
- tournament info
- match info
- match type
- team A / team B
- team handicaps
- team gross
- team net
- team points
- match_points
- winner_name

### Frontend Usage
Use this for:
- list of tournament matches
- summary card for each match

### Recommended Query Pattern
- filter by selected season and tournament type
- use for `midseason` and `yearend` only

### Example UI Usage
Per match card:
- Match Type
- Team A vs Team B
- Gross / Net / Points
- Winner

### Important Note
This view shows team gross/net only, which is correct for your schema and frontend needs.

---

## 11) `public.v_tournament_match_players`

### Purpose
Used for player rows within Midseason and Yearend matches.

### Returns
- tournament info
- match info
- match type
- team
- player
- handicap used
- points earned

### Frontend Usage
Use this for:
- rendering player lists under each tournament match card

### Recommended Query Pattern
- filter by selected season and tournament type
- group rows by `match_id`
- then group by `team_name`

### Example UI Usage
Inside each match card:
- Team Dresden players
- Team York players
- handicap used
- points earned

---

# Page-by-Page Frontend Usage

## Scoreboard Page
Use:
- `v_team_season_scores`
- `v_team_score_progression_weekly`
- `v_latest_match_snapshot`
- `v_team_rosters_display`

### Responsibilities
- show current season totals
- show progression chart
- show latest match
- show each team roster

---

## Stats Page
Use:
- `v_player_season_net_points`

### Responsibilities
- player leaderboard
- won/lost/net tables
- season filter

---

## History / Awards Page
Use:
- `v_awards_history`

### Responsibilities
- all awards across all years
- optional season filtering later if desired

---

## Tournaments Page
Use:
- `v_tournament_summary`
- `v_kickoff_results`
- `v_tournament_match_results`
- `v_tournament_match_players`

### Responsibilities
- filter by year
- filter by tournament type
- show poster + team totals
- show tournament-specific result layout

### Layout Rule
- If tournament type = `kickoff`:
  - use `v_kickoff_results`
- If tournament type = `midseason` or `yearend`:
  - use `v_tournament_match_results`
  - use `v_tournament_match_players`

---

## Gallery Page
Use:
- `v_gallery_images`

### Responsibilities
- render all images
- optional season filter
- caption display

---

# Claude Implementation Guidance

## Querying Rules

1. Always filter by selected season when the page is season-specific.
2. Default to latest season when no season is selected.
3. Avoid recomputing totals in React if the SQL view already provides them.
4. Use views directly in public pages.
5. Only use raw tables in admin/write pages.

## UI Grouping Guidance

### For `v_latest_match_snapshot`
- group by team
- render players under each team

### For `v_team_rosters_display`
- group by team
- sort by `display_order`

### For `v_tournament_match_players`
- group by:
  - `match_id`
  - then `team_name`

---

# Known Limitations

1. Regular match views do not provide individual player gross scores.
   - This is expected from the current schema.
   - Frontend should show team gross/net for regular and tournament matches.

2. `v_tournament_match_results` and `v_tournament_match_players` are only for:
   - `midseason`
   - `yearend`

3. `v_kickoff_results` is only for:
   - `kickoff`

---

# Recommended Public Frontend Build Order

1. Scoreboard page
2. Stats page
3. History / Awards page
4. Tournaments page
5. Gallery page

This order uses the views exactly as designed and keeps the public build clean.

---

# Final Rule for Claude

For public frontend pages:
- prefer views
- avoid raw tables
- keep React logic minimal
- treat this document and the current views snapshot as canonical read-layer documentation