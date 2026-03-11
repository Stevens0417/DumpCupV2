import { createClient } from '@/lib/supabase/server'

export type TeamSeasonScore = {
  season_id: string
  season_year: number
  team_id: string
  team_name: string
  total_points: number
}

export type RosterPlayer = {
  team_id: string
  player_id: string
  player_name: string
  player_handicap: number
  is_captain: boolean
  display_order: number
}

export async function getLatestSeasonTeamScores(): Promise<{
  scores: TeamSeasonScore[]
  seasonId: string | null
}> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('v_team_season_scores')
    .select('season_id, season_year, team_id, team_name, total_points')
    .order('season_year', { ascending: false })
    .limit(10)

  if (error || !data || data.length === 0) {
    return { scores: [], seasonId: null }
  }

  // All rows for the latest season_year
  const latestYear = data[0].season_year
  const scores = data
    .filter((d) => d.season_year === latestYear)
    .map((d) => ({ ...d, total_points: Number(d.total_points) }))

  return { scores, seasonId: scores[0]?.season_id ?? null }
}

export type WeeklyProgression = {
  team_name: string
  week_start: string
  cumulative_points: number
}

export async function getWeeklyProgressionBySeason(seasonId: string): Promise<WeeklyProgression[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('v_team_score_progression_weekly')
    .select('team_name, week_start, cumulative_points')
    .eq('season_id', seasonId)
    .order('week_start', { ascending: true })
    .order('team_name', { ascending: true })

  if (error || !data) return []
  return data.map((d) => ({ ...d, cumulative_points: Number(d.cumulative_points) }))
}

export async function getTeamRostersBySeason(seasonId: string): Promise<RosterPlayer[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('v_team_rosters_display')
    .select('team_id, player_id, player_name, player_handicap, is_captain, display_order')
    .eq('season_id', seasonId)
    .order('team_name', { ascending: true })
    .order('display_order', { ascending: true })

  if (error || !data) return []
  return data.map((d) => ({ ...d, player_handicap: Number(d.player_handicap) }))
}
