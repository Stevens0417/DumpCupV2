# Season Resolution Rules

When entering a match:

Default season = season where:
  season.year = EXTRACT(YEAR FROM match_date)

If overridden manually:
  Explicit season_id takes precedence.

---

If match_date does not match any season:
  Reject insertion OR require manual selection.

---

For queries:

- Public scoreboard = current year season.
- Admin forms default to current year.
- Stats page supports season filter and all-time.
