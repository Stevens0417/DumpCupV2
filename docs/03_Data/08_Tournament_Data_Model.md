# Tournament Data Model

## Kickoff (Medal)

Use:
  tournaments
  tournament_entries
  tournament_position_points

Flow:
  Insert entries
  Assign positions
  Map position to points

---

## Midseason

Use:
  tournaments
  matches (with tournament_id)
  match_players

Behaves like regular matches.

---

## Year-End

Use:
  tournaments
  matches (with tournament_id)
  match_players

Head-to-head format.

---

Poster:
Stored in tournaments.poster_url
