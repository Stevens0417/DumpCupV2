# Schema Overview

## Core Tables

seasons
teams
players
rosters
match_types
match_type_allocations
matches
match_players
tournaments
tournament_entries
tournament_position_points
awards
gallery_images
app_admins

---

## Design Principles

1. Seasons are independent.
2. Players are global.
3. Teams are season-scoped.
4. Rosters are season-scoped with effective dating.
5. Matches belong to a season.
6. Tournaments belong to a season.
7. Tournament matches are regular matches with tournament_id.
8. Awards belong to a season.
9. Gallery images optionally link to season.
