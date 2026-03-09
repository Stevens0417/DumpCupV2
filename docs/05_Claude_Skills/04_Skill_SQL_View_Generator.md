# Skill: SQL View Generator

Purpose:
Generate aggregate views for UI consumption.

---

## Rules

1. Views must calculate heavy aggregations.
2. UI must never aggregate raw match rows.
3. Views must be season-aware.

---

## Common Views

v_team_totals
v_player_stats_by_season
v_player_stats_all_time
v_score_progression
v_last_match
v_current_rosters

---

## Style

Use:
- explicit joins
- clear aliases
- grouped aggregates

Avoid:
- nested subqueries when unnecessary
- ambiguous column names