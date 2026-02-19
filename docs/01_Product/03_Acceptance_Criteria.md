# Acceptance Criteria

## Scoreboard

- Team totals reflect sum of match points + tournament points.
- Trade does not alter historical team totals.
- Score progression graph matches chronological match data.

---

## Player Stats

- Matches played count correctly.
- Wins/losses/ties calculated correctly.
- Tournament points included.
- Season filter works.
- All-time view aggregates correctly.

---

## Match Entry

- Handicap auto-calculates based on:
  - Player handicap
  - Allowance %
  - Allocation weights
- Net score auto-calculates.
- Winning team auto-determined.
- Player points auto-assigned.
- Manual override does not corrupt data.

---

## Draft

- Undrafted table only shows players not assigned.
- Draft assigns correct season/team.
- Trade creates new roster entry.
- Old roster entry gets effective_to date.

---

## Tournament Entry

- Kickoff medal:
  - Net score auto-calculated.
  - Position points assigned.
- Midseason:
  - Each match behaves like regular match.
- Year-end:
  - Head-to-head points assigned correctly.

---

## Gallery

- Thumbnails display correctly.
- Full image opens in modal.
- Order reflects position_order.

---

## Security

- Public cannot write.
- Admin can write.
- RLS blocks unauthorized access.
