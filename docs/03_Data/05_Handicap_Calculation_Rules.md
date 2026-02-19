# Handicap Calculation Rules

Handicap is calculated per team based on match type.

---

Step 1:
Rank players on a team by handicap (lowest first).

Step 2:
Apply match_type.handicap_allowance.
Example:
  10 handicap × 0.90 = 9

Step 3:
Apply allocation weights by rank.
Example (2v2):
  Rank 1 weight = 0.35
  Rank 2 weight = 0.15

Calculation:
  team_handicap =
    SUM(
      player_handicap × allowance × allocation_weight
    )

Step 4:
Round UP to nearest whole number.

---

Overrides:
Admin may override team handicap.
Override does NOT alter stored player handicaps.

---

Important:
Handicap logic must live in:
  /src/lib/domain/handicaps/
