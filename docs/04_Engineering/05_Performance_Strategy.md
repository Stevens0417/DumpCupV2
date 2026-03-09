# Performance Strategy

## General

- Prefer server-side rendering.
- Avoid heavy client-side calculations.
- Use SQL views for aggregates.

---

## Scoreboard

Use pre-aggregated SQL views:
- v_team_totals
- v_score_progression
- v_last_match

Never compute totals in React.

---

## Stats Page

Use:
- v_player_stats_by_season
- v_player_stats_all_time

Avoid grouping in browser.

---

## Gallery

- Load thumbnails first.
- Lazy load full image.
- Avoid full-resolution image loading in grid.

---

## Database Indexing

Ensure indexes on:
- season_id
- match_date
- player_id
- team_id
- tournament_id
- effective_from
- effective_to