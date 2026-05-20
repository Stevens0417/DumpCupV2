-- Add status = 'complete' filter to all views that aggregate tournament entry points.
-- Requires migration 0005 (status column on tournaments) to be applied first.

-- ── v_kickoff_results ─────────────────────────────────────────────────────────
-- Only show results for completed kickoff tournaments.
CREATE OR REPLACE VIEW public.v_kickoff_results AS
SELECT
  t.id AS tournament_id,
  t.season_id,
  s.year AS season_year,
  t.type AS tournament_type,
  t.tournament_date,
  t.course,
  t.poster_url,
  te.id AS tournament_entry_id,
  p.id AS player_id,
  p.full_name AS player_name,
  tm.id AS team_id,
  tm.name AS team_name,
  te.gross_score,
  te.handicap_used,
  te.net_score,
  te.finish_position,
  te.points_awarded,
  row_number() OVER (PARTITION BY t.id ORDER BY te.net_score, te.gross_score, p.full_name) AS display_rank
FROM tournaments t
  JOIN seasons s ON s.id = t.season_id
  JOIN tournament_entries te ON te.tournament_id = t.id
  LEFT JOIN players p ON p.id = te.player_id
  LEFT JOIN teams tm ON tm.id = te.team_id
WHERE t.type = 'kickoff'::tournament_type
  AND t.status = 'complete'
ORDER BY
  s.year DESC,
  t.tournament_date DESC,
  (row_number() OVER (PARTITION BY t.id ORDER BY te.net_score, te.gross_score, p.full_name));

-- ── v_tournament_summary ──────────────────────────────────────────────────────
-- Kickoff team points only count when the tournament is complete.
CREATE OR REPLACE VIEW public.v_tournament_summary AS
WITH kickoff_team_points AS (
  SELECT
    t.id AS tournament_id,
    t.season_id,
    te.team_id,
    sum(COALESCE(te.points_awarded, 0::numeric)) AS team_points
  FROM tournaments t
    JOIN tournament_entries te ON te.tournament_id = t.id
  WHERE t.type = 'kickoff'::tournament_type
    AND t.status = 'complete'
  GROUP BY t.id, t.season_id, te.team_id
), match_tournament_team_points AS (
  SELECT
    t.id AS tournament_id,
    t.season_id,
    m.team_a_id AS team_id,
    sum(COALESCE(m.team_a_points, 0::numeric)) AS team_points
  FROM tournaments t
    JOIN matches m ON m.tournament_id = t.id
  WHERE t.type = ANY (ARRAY['midseason'::tournament_type, 'yearend'::tournament_type])
  GROUP BY t.id, t.season_id, m.team_a_id
  UNION ALL
  SELECT
    t.id AS tournament_id,
    t.season_id,
    m.team_b_id AS team_id,
    sum(COALESCE(m.team_b_points, 0::numeric)) AS team_points
  FROM tournaments t
    JOIN matches m ON m.tournament_id = t.id
  WHERE t.type = ANY (ARRAY['midseason'::tournament_type, 'yearend'::tournament_type])
  GROUP BY t.id, t.season_id, m.team_b_id
), all_team_points AS (
  SELECT tournament_id, season_id, team_id, team_points FROM kickoff_team_points
  UNION ALL
  SELECT tournament_id, season_id, team_id, team_points FROM match_tournament_team_points
), rolled_team_points AS (
  SELECT tournament_id, season_id, team_id, sum(team_points) AS team_points
  FROM all_team_points
  GROUP BY tournament_id, season_id, team_id
)
SELECT
  t.id AS tournament_id,
  t.season_id,
  s.year AS season_year,
  t.type AS tournament_type,
  t.tournament_date,
  t.course,
  t.poster_url,
  tm.id AS team_id,
  tm.name AS team_name,
  COALESCE(rtp.team_points, 0::numeric) AS team_points
FROM tournaments t
  JOIN seasons s ON s.id = t.season_id
  JOIN teams tm ON tm.season_id = t.season_id
  LEFT JOIN rolled_team_points rtp ON rtp.tournament_id = t.id AND rtp.team_id = tm.id
ORDER BY s.year DESC, t.tournament_date DESC, tm.name;

-- ── v_player_season_net_points ────────────────────────────────────────────────
-- Tournament points only count when status = 'complete'.
CREATE OR REPLACE VIEW public.v_player_season_net_points AS
WITH match_base AS (
  SELECT
    m.id AS match_id,
    m.season_id,
    m.holes,
    mt.players_per_team,
    m.holes::numeric / 18.0 AS base_points_per_player,
    m.team_a_points,
    m.team_b_points,
    CASE
      WHEN COALESCE(m.team_a_points, 0::numeric) = COALESCE(m.team_b_points, 0::numeric) THEN true
      ELSE false
    END AS is_tie
  FROM matches m
    JOIN match_types mt ON mt.id = m.match_type_id
), match_player_points AS (
  SELECT
    mb.season_id,
    mp.player_id,
    mp.team_id,
    COALESCE(mp.points_earned, 0::numeric) AS points_won,
    CASE
      WHEN mb.is_tie THEN 0::numeric
      WHEN COALESCE(mp.points_earned, 0::numeric) > 0::numeric THEN 0::numeric
      ELSE mb.base_points_per_player
    END AS points_lost
  FROM match_players mp
    JOIN match_base mb ON mb.match_id = mp.match_id
), tournament_player_points AS (
  SELECT
    t.season_id,
    te.player_id,
    te.team_id,
    COALESCE(te.points_awarded, 0::numeric) AS points_won,
    0::numeric AS points_lost
  FROM tournaments t
    JOIN tournament_entries te ON te.tournament_id = t.id
  WHERE t.status = 'complete'
), combined AS (
  SELECT season_id, player_id, team_id, points_won, points_lost FROM match_player_points
  UNION ALL
  SELECT season_id, player_id, team_id, points_won, points_lost FROM tournament_player_points
)
SELECT
  s.id AS season_id,
  s.year AS season_year,
  p.id AS player_id,
  p.full_name AS player_name,
  COALESCE(sum(c.points_won), 0::numeric) AS points_won,
  COALESCE(sum(c.points_lost), 0::numeric) AS points_lost,
  COALESCE(sum(c.points_won), 0::numeric) - COALESCE(sum(c.points_lost), 0::numeric) AS net_points
FROM players p
  CROSS JOIN seasons s
  LEFT JOIN combined c ON c.player_id = p.id AND c.season_id = s.id
GROUP BY s.id, s.year, p.id, p.full_name
HAVING
  COALESCE(sum(c.points_won), 0::numeric) <> 0::numeric
  OR COALESCE(sum(c.points_lost), 0::numeric) <> 0::numeric
ORDER BY s.year DESC, (COALESCE(sum(c.points_won), 0::numeric) - COALESCE(sum(c.points_lost), 0::numeric)) DESC, p.full_name;

-- ── v_team_season_scores ──────────────────────────────────────────────────────
-- Tournament points only count when status = 'complete'.
CREATE OR REPLACE VIEW public.v_team_season_scores AS
WITH match_points AS (
  SELECT m.season_id, mp.team_id, sum(mp.points_earned) AS points
  FROM matches m
    JOIN match_players mp ON mp.match_id = m.id
  GROUP BY m.season_id, mp.team_id
), tournament_points AS (
  SELECT t.season_id, te.team_id, sum(te.points_awarded) AS points
  FROM tournaments t
    JOIN tournament_entries te ON te.tournament_id = t.id
  WHERE t.status = 'complete'
  GROUP BY t.season_id, te.team_id
), combined_points AS (
  SELECT season_id, team_id, points FROM match_points
  UNION ALL
  SELECT season_id, team_id, points FROM tournament_points
)
SELECT
  s.id AS season_id,
  s.year AS season_year,
  t.id AS team_id,
  t.name AS team_name,
  COALESCE(sum(cp.points), 0::numeric) AS total_points
FROM teams t
  JOIN seasons s ON s.id = t.season_id
  LEFT JOIN combined_points cp ON cp.team_id = t.id AND cp.season_id = s.id
GROUP BY s.id, s.year, t.id, t.name
ORDER BY s.year DESC, (COALESCE(sum(cp.points), 0::numeric)) DESC;

-- ── v_team_score_progression ──────────────────────────────────────────────────
-- Tournament events only appear in progression after status = 'complete'.
CREATE OR REPLACE VIEW public.v_team_score_progression AS
WITH match_events AS (
  SELECT m.season_id, m.match_date AS event_date, 'match'::text AS event_type,
    m.id AS source_id, m.team_a_id AS team_id, COALESCE(m.team_a_points, 0::numeric) AS points_delta
  FROM matches m
  UNION ALL
  SELECT m.season_id, m.match_date AS event_date, 'match'::text AS event_type,
    m.id AS source_id, m.team_b_id AS team_id, COALESCE(m.team_b_points, 0::numeric) AS points_delta
  FROM matches m
), tournament_events AS (
  SELECT
    t.season_id,
    t.tournament_date AS event_date,
    'tournament'::text AS event_type,
    t.id AS source_id,
    te.team_id,
    COALESCE(sum(te.points_awarded), 0::numeric) AS points_delta
  FROM tournaments t
    JOIN tournament_entries te ON te.tournament_id = t.id
  WHERE t.status = 'complete'
  GROUP BY t.season_id, t.tournament_date, t.id, te.team_id
), all_events AS (
  SELECT season_id, event_date, event_type, source_id, team_id, points_delta FROM match_events
  UNION ALL
  SELECT season_id, event_date, event_type, source_id, team_id, points_delta FROM tournament_events
), daily_team_points AS (
  SELECT season_id, event_date, event_type, source_id, team_id, sum(points_delta) AS points_delta
  FROM all_events
  GROUP BY season_id, event_date, event_type, source_id, team_id
)
SELECT
  s.id AS season_id,
  s.year AS season_year,
  t.id AS team_id,
  t.name AS team_name,
  d.event_date,
  d.event_type,
  d.source_id,
  d.points_delta,
  sum(d.points_delta) OVER (
    PARTITION BY d.season_id, d.team_id
    ORDER BY d.event_date, d.event_type, d.source_id
    ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
  ) AS cumulative_points
FROM daily_team_points d
  JOIN seasons s ON s.id = d.season_id
  JOIN teams t ON t.id = d.team_id
ORDER BY s.year DESC, d.event_date, t.name;

-- ── v_team_score_progression_weekly ──────────────────────────────────────────
-- Tournament events only appear in weekly progression after status = 'complete'.
CREATE OR REPLACE VIEW public.v_team_score_progression_weekly AS
WITH match_events AS (
  SELECT m.season_id,
    date_trunc('week'::text, m.match_date::timestamp with time zone)::date AS week_start,
    m.team_a_id AS team_id, COALESCE(m.team_a_points, 0::numeric) AS points_delta
  FROM matches m
  UNION ALL
  SELECT m.season_id,
    date_trunc('week'::text, m.match_date::timestamp with time zone)::date AS week_start,
    m.team_b_id AS team_id, COALESCE(m.team_b_points, 0::numeric) AS points_delta
  FROM matches m
), tournament_events AS (
  SELECT
    t.season_id,
    date_trunc('week'::text, t.tournament_date::timestamp with time zone)::date AS week_start,
    te.team_id,
    COALESCE(sum(te.points_awarded), 0::numeric) AS points_delta
  FROM tournaments t
    JOIN tournament_entries te ON te.tournament_id = t.id
  WHERE t.status = 'complete'
  GROUP BY t.season_id, (date_trunc('week'::text, t.tournament_date::timestamp with time zone)::date), te.team_id
), all_events AS (
  SELECT season_id, week_start, team_id, points_delta FROM match_events
  UNION ALL
  SELECT season_id, week_start, team_id, points_delta FROM tournament_events
), weekly_team_points AS (
  SELECT season_id, week_start, team_id, sum(points_delta) AS points_delta
  FROM all_events
  GROUP BY season_id, week_start, team_id
)
SELECT
  s.id AS season_id,
  s.year AS season_year,
  t.id AS team_id,
  t.name AS team_name,
  w.week_start,
  w.points_delta,
  sum(w.points_delta) OVER (
    PARTITION BY w.season_id, w.team_id
    ORDER BY w.week_start
    ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
  ) AS cumulative_points
FROM weekly_team_points w
  JOIN seasons s ON s.id = w.season_id
  JOIN teams t ON t.id = w.team_id
ORDER BY s.year DESC, w.week_start, t.name;
