# Point Allocation Rules

## Regular Match

Winning team = lower net score.

If tie:
  Points may be split.

Default:
  1 point per 18 holes per player.

If 9 holes:
  0.5 default (unless specified otherwise).

---

Team points:
  Auto-calculated.

Player points:
  Auto-assigned to players on winning team.

Admin override allowed.

---

## Tournament (Kickoff Medal)

Points awarded by position.
Defined in tournament_position_points.

Negative values allowed.

Points affect:
  - Player totals
  - Team totals

---

## Midseason Tournament

Matches function like regular matches.

---

## Year-End Tournament

Head-to-head.
Points affect both:
  - Team totals
  - Player totals

---

Critical:
Team totals must always equal sum of:
  regular match points
  + tournament match points
  + medal position points
