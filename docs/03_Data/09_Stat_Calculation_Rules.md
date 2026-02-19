# Stat Calculation Rules

Matches Played:
  count(match_players rows)

Wins:
  matches where player.points_earned > 0

Losses:
  matches where player participated but points_earned = 0

Ties:
  optional (if tie logic exists)

Tournament Points:
  sum(tournament_entries.points_awarded)

Net Points:
  sum(match_players.points_earned)
  + sum(tournament_entries.points_awarded)

All-Time:
  Aggregate across seasons.

Season View:
  Filter by season_id.
