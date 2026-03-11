# Current Views Snapshot (public) ## v_awards_history ### Columns award_id uuid season_id uuid season_year integer award USER-DEFINED (award_type) player_id uuid player_name text team_id uuid team_name text team_captain text final_score text net_points numeric notes text created_at timestamp with time zone ### Dependencies awards players seasons teams v_awards_history ### Definition
sql
 SELECT a.id AS award_id,
    s.id AS season_id,
    s.year AS season_year,
    a.award,
    p.id AS player_id,
    p.full_name AS player_name,
    t.id AS team_id,
    t.name AS team_name,
    a.team_captain,
    a.final_score,
    a.net_points,
    a.notes,
    a.created_at
   FROM awards a
     JOIN seasons s ON s.id = a.season_id
     LEFT JOIN players p ON p.id = a.player_id
     LEFT JOIN teams t ON t.id = a.team_id
  ORDER BY s.year DESC, a.award, p.full_name;
## v_gallery_images ### Columns gallery_image_id uuid season_id uuid season_year integer image_url text thumbnail_url text position_order integer caption text created_at timestamp with time zone updated_at timestamp with time zone ### Dependencies gallery_images seasons v_gallery_images ### Definition
sql
 SELECT gi.id AS gallery_image_id,
    gi.season_id,
    s.year AS season_year,
    gi.image_url,
    gi.thumbnail_url,
    gi.position_order,
    gi.caption,
    gi.created_at,
    gi.updated_at
   FROM gallery_images gi
     LEFT JOIN seasons s ON s.id = gi.season_id
  ORDER BY s.year DESC NULLS LAST, gi.position_order, gi.created_at DESC;
## v_kickoff_results ### Columns tournament_id uuid season_id uuid season_year integer tournament_type USER-DEFINED (tournament_type) tournament_date date course text poster_url text tournament_entry_id uuid player_id uuid player_name text team_id uuid team_name text gross_score integer handicap_used numeric net_score integer finish_position integer points_awarded numeric display_rank bigint ### Dependencies players seasons teams tournament_entries tournaments v_kickoff_results ### Definition
sql
 SELECT t.id AS tournament_id,
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
  ORDER BY s.year DESC, t.tournament_date DESC, (row_number() OVER (PARTITION BY t.id ORDER BY te.net_score, te.gross_score, p.full_name));
## v_latest_match_snapshot ### Columns season_id uuid season_year integer match_id uuid match_date date holes integer match_type_id uuid match_type_name text match_player_id uuid player_id uuid player_name text team_id uuid team_name text handicap_used numeric points_earned numeric team_gross_score integer team_net_score integer team_points numeric result text ### Dependencies match_players match_types matches players seasons teams v_latest_match_snapshot ### Definition
sql
 WITH ranked_matches AS (
         SELECT m.id,
            m.season_id,
            m.match_date,
            m.holes,
            m.match_type_id,
            m.team_a_id,
            m.team_b_id,
            m.team_a_handicap,
            m.team_b_handicap,
            m.team_a_gross,
            m.team_b_gross,
            m.team_a_net,
            m.team_b_net,
            m.team_a_points,
            m.team_b_points,
            m.tournament_id,
            m.notes,
            m.created_at,
            m.updated_at,
            m.match_points,
            row_number() OVER (PARTITION BY m.season_id ORDER BY m.match_date DESC, m.created_at DESC, m.id DESC) AS rn
           FROM matches m
        ), latest_match AS (
         SELECT ranked_matches.id,
            ranked_matches.season_id,
            ranked_matches.match_date,
            ranked_matches.holes,
            ranked_matches.match_type_id,
            ranked_matches.team_a_id,
            ranked_matches.team_b_id,
            ranked_matches.team_a_handicap,
            ranked_matches.team_b_handicap,
            ranked_matches.team_a_gross,
            ranked_matches.team_b_gross,
            ranked_matches.team_a_net,
            ranked_matches.team_b_net,
            ranked_matches.team_a_points,
            ranked_matches.team_b_points,
            ranked_matches.tournament_id,
            ranked_matches.notes,
            ranked_matches.created_at,
            ranked_matches.updated_at,
            ranked_matches.match_points,
            ranked_matches.rn
           FROM ranked_matches
          WHERE ranked_matches.rn = 1
        )
 SELECT s.id AS season_id,
    s.year AS season_year,
    lm.id AS match_id,
    lm.match_date,
    lm.holes,
    mt.id AS match_type_id,
    mt.name AS match_type_name,
    mp.id AS match_player_id,
    p.id AS player_id,
    p.full_name AS player_name,
    tm.id AS team_id,
    tm.name AS team_name,
    mp.handicap_used,
    mp.points_earned,
        CASE
            WHEN mp.team_id = lm.team_a_id THEN lm.team_a_gross
            WHEN mp.team_id = lm.team_b_id THEN lm.team_b_gross
            ELSE NULL::integer
        END AS team_gross_score,
        CASE
            WHEN mp.team_id = lm.team_a_id THEN lm.team_a_net
            WHEN mp.team_id = lm.team_b_id THEN lm.team_b_net
            ELSE NULL::integer
        END AS team_net_score,
        CASE
            WHEN mp.team_id = lm.team_a_id THEN lm.team_a_points
            WHEN mp.team_id = lm.team_b_id THEN lm.team_b_points
            ELSE NULL::numeric
        END AS team_points,
        CASE
            WHEN lm.team_a_net IS NOT NULL AND lm.team_b_net IS NOT NULL AND lm.team_a_net = lm.team_b_net THEN 'tie'::text
            WHEN mp.team_id = lm.team_a_id AND lm.team_a_net IS NOT NULL AND lm.team_b_net IS NOT NULL AND lm.team_a_net < lm.team_b_net THEN 'win'::text
            WHEN mp.team_id = lm.team_b_id AND lm.team_a_net IS NOT NULL AND lm.team_b_net IS NOT NULL AND lm.team_b_net < lm.team_a_net THEN 'win'::text
            WHEN mp.team_id = lm.team_a_id AND lm.team_a_net IS NOT NULL AND lm.team_b_net IS NOT NULL AND lm.team_a_net > lm.team_b_net THEN 'loss'::text
            WHEN mp.team_id = lm.team_b_id AND lm.team_a_net IS NOT NULL AND lm.team_b_net IS NOT NULL AND lm.team_b_net > lm.team_a_net THEN 'loss'::text
            ELSE NULL::text
        END AS result
   FROM latest_match lm
     JOIN seasons s ON s.id = lm.season_id
     JOIN match_types mt ON mt.id = lm.match_type_id
     JOIN match_players mp ON mp.match_id = lm.id
     JOIN players p ON p.id = mp.player_id
     JOIN teams tm ON tm.id = mp.team_id
  ORDER BY s.year DESC, lm.match_date DESC, tm.name, p.full_name;
## v_player_season_net_points ### Columns season_id uuid season_year integer player_id uuid player_name text points_won numeric points_lost numeric net_points numeric ### Dependencies match_players match_types matches players seasons tournament_entries tournaments v_player_season_net_points ### Definition
sql
 WITH match_base AS (
         SELECT m.id AS match_id,
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
         SELECT mb.season_id,
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
         SELECT t.season_id,
            te.player_id,
            te.team_id,
            COALESCE(te.points_awarded, 0::numeric) AS points_won,
            0::numeric AS points_lost
           FROM tournaments t
             JOIN tournament_entries te ON te.tournament_id = t.id
        ), combined AS (
         SELECT match_player_points.season_id,
            match_player_points.player_id,
            match_player_points.team_id,
            match_player_points.points_won,
            match_player_points.points_lost
           FROM match_player_points
        UNION ALL
         SELECT tournament_player_points.season_id,
            tournament_player_points.player_id,
            tournament_player_points.team_id,
            tournament_player_points.points_won,
            tournament_player_points.points_lost
           FROM tournament_player_points
        )
 SELECT s.id AS season_id,
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
 HAVING COALESCE(sum(c.points_won), 0::numeric) <> 0::numeric OR COALESCE(sum(c.points_lost), 0::numeric) <> 0::numeric
  ORDER BY s.year DESC, (COALESCE(sum(c.points_won), 0::numeric) - COALESCE(sum(c.points_lost), 0::numeric)) DESC, p.full_name;
## v_team_rosters_display ### Columns season_id uuid season_year integer team_id uuid team_name text captain_name text player_id uuid player_name text player_handicap numeric is_captain boolean display_group integer display_order bigint ### Dependencies players rosters seasons teams v_team_rosters_display ### Definition
sql
 WITH active_rosters AS (
         SELECT r.season_id,
            r.team_id,
            r.player_id,
            row_number() OVER (PARTITION BY r.season_id, r.team_id, r.player_id ORDER BY (COALESCE(r.effective_to, '9999-12-31'::date)) DESC, r.effective_from DESC, r.created_at DESC) AS rn
           FROM rosters r
          WHERE r.effective_to IS NULL
        ), team_players AS (
         SELECT s.id AS season_id,
            s.year AS season_year,
            t.id AS team_id,
            t.name AS team_name,
            t.captain_name,
            p.id AS player_id,
            p.full_name AS player_name,
            p.handicap AS player_handicap,
                CASE
                    WHEN t.captain_name IS NOT NULL AND lower(TRIM(BOTH FROM t.captain_name)) = lower(TRIM(BOTH FROM p.full_name)) THEN true
                    ELSE false
                END AS is_captain
           FROM active_rosters ar
             JOIN teams t ON t.id = ar.team_id
             JOIN seasons s ON s.id = ar.season_id
             JOIN players p ON p.id = ar.player_id
          WHERE ar.rn = 1
        )
 SELECT season_id,
    season_year,
    team_id,
    team_name,
    captain_name,
    player_id,
    player_name,
    player_handicap,
    is_captain,
        CASE
            WHEN is_captain THEN 0
            ELSE 1
        END AS display_group,
    row_number() OVER (PARTITION BY season_id, team_id ORDER BY (
        CASE
            WHEN is_captain THEN 0
            ELSE 1
        END), player_handicap, player_name) AS display_order
   FROM team_players
  ORDER BY season_year DESC, team_name, (
        CASE
            WHEN is_captain THEN 0
            ELSE 1
        END), player_handicap, player_name;
## v_team_score_progression ### Columns season_id uuid season_year integer team_id uuid team_name text event_date date event_type text source_id uuid points_delta numeric cumulative_points numeric ### Dependencies matches seasons teams tournament_entries tournaments v_team_score_progression ### Definition
sql
 WITH match_events AS (
         SELECT m.season_id,
            m.match_date AS event_date,
            'match'::text AS event_type,
            m.id AS source_id,
            m.team_a_id AS team_id,
            COALESCE(m.team_a_points, 0::numeric) AS points_delta
           FROM matches m
        UNION ALL
         SELECT m.season_id,
            m.match_date AS event_date,
            'match'::text AS event_type,
            m.id AS source_id,
            m.team_b_id AS team_id,
            COALESCE(m.team_b_points, 0::numeric) AS points_delta
           FROM matches m
        ), tournament_events AS (
         SELECT t_1.season_id,
            t_1.tournament_date AS event_date,
            'tournament'::text AS event_type,
            t_1.id AS source_id,
            te.team_id,
            COALESCE(sum(te.points_awarded), 0::numeric) AS points_delta
           FROM tournaments t_1
             JOIN tournament_entries te ON te.tournament_id = t_1.id
          GROUP BY t_1.season_id, t_1.tournament_date, t_1.id, te.team_id
        ), all_events AS (
         SELECT match_events.season_id,
            match_events.event_date,
            match_events.event_type,
            match_events.source_id,
            match_events.team_id,
            match_events.points_delta
           FROM match_events
        UNION ALL
         SELECT tournament_events.season_id,
            tournament_events.event_date,
            tournament_events.event_type,
            tournament_events.source_id,
            tournament_events.team_id,
            tournament_events.points_delta
           FROM tournament_events
        ), daily_team_points AS (
         SELECT all_events.season_id,
            all_events.event_date,
            all_events.event_type,
            all_events.source_id,
            all_events.team_id,
            sum(all_events.points_delta) AS points_delta
           FROM all_events
          GROUP BY all_events.season_id, all_events.event_date, all_events.event_type, all_events.source_id, all_events.team_id
        )
 SELECT s.id AS season_id,
    s.year AS season_year,
    t.id AS team_id,
    t.name AS team_name,
    d.event_date,
    d.event_type,
    d.source_id,
    d.points_delta,
    sum(d.points_delta) OVER (PARTITION BY d.season_id, d.team_id ORDER BY d.event_date, d.event_type, d.source_id ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS cumulative_points
   FROM daily_team_points d
     JOIN seasons s ON s.id = d.season_id
     JOIN teams t ON t.id = d.team_id
  ORDER BY s.year DESC, d.event_date, t.name;
## v_team_score_progression_weekly ### Columns season_id uuid season_year integer team_id uuid team_name text week_start date points_delta numeric cumulative_points numeric ### Dependencies matches seasons teams tournament_entries tournaments v_team_score_progression_weekly ### Definition
sql
 WITH match_events AS (
         SELECT m.season_id,
            date_trunc('week'::text, m.match_date::timestamp with time zone)::date AS week_start,
            m.team_a_id AS team_id,
            COALESCE(m.team_a_points, 0::numeric) AS points_delta
           FROM matches m
        UNION ALL
         SELECT m.season_id,
            date_trunc('week'::text, m.match_date::timestamp with time zone)::date AS week_start,
            m.team_b_id AS team_id,
            COALESCE(m.team_b_points, 0::numeric) AS points_delta
           FROM matches m
        ), tournament_events AS (
         SELECT t_1.season_id,
            date_trunc('week'::text, t_1.tournament_date::timestamp with time zone)::date AS week_start,
            te.team_id,
            COALESCE(sum(te.points_awarded), 0::numeric) AS points_delta
           FROM tournaments t_1
             JOIN tournament_entries te ON te.tournament_id = t_1.id
          GROUP BY t_1.season_id, (date_trunc('week'::text, t_1.tournament_date::timestamp with time zone)::date), te.team_id
        ), all_events AS (
         SELECT match_events.season_id,
            match_events.week_start,
            match_events.team_id,
            match_events.points_delta
           FROM match_events
        UNION ALL
         SELECT tournament_events.season_id,
            tournament_events.week_start,
            tournament_events.team_id,
            tournament_events.points_delta
           FROM tournament_events
        ), weekly_team_points AS (
         SELECT all_events.season_id,
            all_events.week_start,
            all_events.team_id,
            sum(all_events.points_delta) AS points_delta
           FROM all_events
          GROUP BY all_events.season_id, all_events.week_start, all_events.team_id
        )
 SELECT s.id AS season_id,
    s.year AS season_year,
    t.id AS team_id,
    t.name AS team_name,
    w.week_start,
    w.points_delta,
    sum(w.points_delta) OVER (PARTITION BY w.season_id, w.team_id ORDER BY w.week_start ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS cumulative_points
   FROM weekly_team_points w
     JOIN seasons s ON s.id = w.season_id
     JOIN teams t ON t.id = w.team_id
  ORDER BY s.year DESC, w.week_start, t.name;
## v_team_season_scores ### Columns season_id uuid season_year integer team_id uuid team_name text total_points numeric ### Dependencies match_players matches seasons teams tournament_entries tournaments v_team_season_scores ### Definition
sql
 WITH match_points AS (
         SELECT m.season_id,
            mp.team_id,
            sum(mp.points_earned) AS points
           FROM matches m
             JOIN match_players mp ON mp.match_id = m.id
          GROUP BY m.season_id, mp.team_id
        ), tournament_points AS (
         SELECT t_1.season_id,
            te.team_id,
            sum(te.points_awarded) AS points
           FROM tournaments t_1
             JOIN tournament_entries te ON te.tournament_id = t_1.id
          GROUP BY t_1.season_id, te.team_id
        ), combined_points AS (
         SELECT match_points.season_id,
            match_points.team_id,
            match_points.points
           FROM match_points
        UNION ALL
         SELECT tournament_points.season_id,
            tournament_points.team_id,
            tournament_points.points
           FROM tournament_points
        )
 SELECT s.id AS season_id,
    s.year AS season_year,
    t.id AS team_id,
    t.name AS team_name,
    COALESCE(sum(cp.points), 0::numeric) AS total_points
   FROM teams t
     JOIN seasons s ON s.id = t.season_id
     LEFT JOIN combined_points cp ON cp.team_id = t.id AND cp.season_id = s.id
  GROUP BY s.id, s.year, t.id, t.name
  ORDER BY s.year DESC, (COALESCE(sum(cp.points), 0::numeric)) DESC;
## v_tournament_match_players ### Columns tournament_id uuid season_id uuid season_year integer tournament_type USER-DEFINED (tournament_type) tournament_date date match_id uuid match_date date match_type_id uuid match_type_name text match_player_id uuid team_id uuid team_name text player_id uuid player_name text handicap_used numeric points_earned numeric ### Dependencies match_players match_types matches players seasons teams tournaments v_tournament_match_players ### Definition
sql
 SELECT t.id AS tournament_id,
    t.season_id,
    s.year AS season_year,
    t.type AS tournament_type,
    t.tournament_date,
    m.id AS match_id,
    m.match_date,
    mt.id AS match_type_id,
    mt.name AS match_type_name,
    mp.id AS match_player_id,
    tm.id AS team_id,
    tm.name AS team_name,
    p.id AS player_id,
    p.full_name AS player_name,
    mp.handicap_used,
    mp.points_earned
   FROM tournaments t
     JOIN seasons s ON s.id = t.season_id
     JOIN matches m ON m.tournament_id = t.id
     JOIN match_types mt ON mt.id = m.match_type_id
     JOIN match_players mp ON mp.match_id = m.id
     JOIN players p ON p.id = mp.player_id
     JOIN teams tm ON tm.id = mp.team_id
  WHERE t.type = ANY (ARRAY['midseason'::tournament_type, 'yearend'::tournament_type])
  ORDER BY s.year DESC, t.tournament_date DESC, m.match_date, tm.name, p.full_name;
## v_tournament_match_results ### Columns tournament_id uuid season_id uuid season_year integer tournament_type USER-DEFINED (tournament_type) tournament_date date course text poster_url text match_id uuid match_date date holes integer match_type_id uuid match_type_name text team_a_id uuid team_a_name text team_a_handicap integer team_a_gross integer team_a_net integer team_a_points numeric team_b_id uuid team_b_name text team_b_handicap integer team_b_gross integer team_b_net integer team_b_points numeric match_points numeric notes text winner_name text ### Dependencies match_types matches seasons teams tournaments v_tournament_match_results ### Definition
sql
 SELECT t.id AS tournament_id,
    t.season_id,
    s.year AS season_year,
    t.type AS tournament_type,
    t.tournament_date,
    t.course,
    t.poster_url,
    m.id AS match_id,
    m.match_date,
    m.holes,
    mt.id AS match_type_id,
    mt.name AS match_type_name,
    ta.id AS team_a_id,
    ta.name AS team_a_name,
    m.team_a_handicap,
    m.team_a_gross,
    m.team_a_net,
    m.team_a_points,
    tb.id AS team_b_id,
    tb.name AS team_b_name,
    m.team_b_handicap,
    m.team_b_gross,
    m.team_b_net,
    m.team_b_points,
    m.match_points,
    m.notes,
        CASE
            WHEN m.team_a_net IS NOT NULL AND m.team_b_net IS NOT NULL AND m.team_a_net < m.team_b_net THEN ta.name
            WHEN m.team_a_net IS NOT NULL AND m.team_b_net IS NOT NULL AND m.team_b_net < m.team_a_net THEN tb.name
            WHEN m.team_a_net IS NOT NULL AND m.team_b_net IS NOT NULL AND m.team_a_net = m.team_b_net THEN 'Tie'::text
            ELSE NULL::text
        END AS winner_name
   FROM tournaments t
     JOIN seasons s ON s.id = t.season_id
     JOIN matches m ON m.tournament_id = t.id
     JOIN match_types mt ON mt.id = m.match_type_id
     JOIN teams ta ON ta.id = m.team_a_id
     JOIN teams tb ON tb.id = m.team_b_id
  WHERE t.type = ANY (ARRAY['midseason'::tournament_type, 'yearend'::tournament_type])
  ORDER BY s.year DESC, t.tournament_date DESC, m.match_date, m.id;
## v_tournament_summary ### Columns tournament_id uuid season_id uuid season_year integer tournament_type USER-DEFINED (tournament_type) tournament_date date course text poster_url text team_id uuid team_name text team_points numeric ### Dependencies matches seasons teams tournament_entries tournaments v_tournament_summary ### Definition
sql
 WITH kickoff_team_points AS (
         SELECT t_1.id AS tournament_id,
            t_1.season_id,
            te.team_id,
            sum(COALESCE(te.points_awarded, 0::numeric)) AS team_points
           FROM tournaments t_1
             JOIN tournament_entries te ON te.tournament_id = t_1.id
          WHERE t_1.type = 'kickoff'::tournament_type
          GROUP BY t_1.id, t_1.season_id, te.team_id
        ), match_tournament_team_points AS (
         SELECT t_1.id AS tournament_id,
            t_1.season_id,
            m.team_a_id AS team_id,
            sum(COALESCE(m.team_a_points, 0::numeric)) AS team_points
           FROM tournaments t_1
             JOIN matches m ON m.tournament_id = t_1.id
          WHERE t_1.type = ANY (ARRAY['midseason'::tournament_type, 'yearend'::tournament_type])
          GROUP BY t_1.id, t_1.season_id, m.team_a_id
        UNION ALL
         SELECT t_1.id AS tournament_id,
            t_1.season_id,
            m.team_b_id AS team_id,
            sum(COALESCE(m.team_b_points, 0::numeric)) AS team_points
           FROM tournaments t_1
             JOIN matches m ON m.tournament_id = t_1.id
          WHERE t_1.type = ANY (ARRAY['midseason'::tournament_type, 'yearend'::tournament_type])
          GROUP BY t_1.id, t_1.season_id, m.team_b_id
        ), all_team_points AS (
         SELECT kickoff_team_points.tournament_id,
            kickoff_team_points.season_id,
            kickoff_team_points.team_id,
            kickoff_team_points.team_points
           FROM kickoff_team_points
        UNION ALL
         SELECT match_tournament_team_points.tournament_id,
            match_tournament_team_points.season_id,
            match_tournament_team_points.team_id,
            match_tournament_team_points.team_points
           FROM match_tournament_team_points
        ), rolled_team_points AS (
         SELECT all_team_points.tournament_id,
            all_team_points.season_id,
            all_team_points.team_id,
            sum(all_team_points.team_points) AS team_points
           FROM all_team_points
          GROUP BY all_team_points.tournament_id, all_team_points.season_id, all_team_points.team_id
        )
 SELECT t.id AS tournament_id,
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