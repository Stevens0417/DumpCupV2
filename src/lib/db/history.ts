import { createClient } from '@/lib/supabase/server'

export type AwardRow = {
  season_year: number
  player_name: string | null
  team_name: string | null
  award: string
}

export type HistorySeasonScore = {
  season_id: string
  season_year: number
  team_id: string
  team_name: string
  total_points: number
}

export type TeamPointsHistory = {
  scope: string
  season_id: string | null
  season_year: number | null
  team_id: string
  team_name: string
  total_points: number
}

export async function getAwardsHistory(): Promise<AwardRow[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('v_awards_history')
    .select('season_year, player_name, team_name, award')
    .order('season_year', { ascending: false })

  if (error || !data) return []
  return data
}

export async function getTeamPointsHistory(): Promise<TeamPointsHistory[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('v_team_points_history')
    .select('scope, season_id, season_year, team_id, team_name, total_points')

  if (error || !data) return []
  return data.map((d) => ({ ...d, total_points: Number(d.total_points) }))
}

export async function getAllSeasonTeamScores(): Promise<HistorySeasonScore[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('v_team_season_scores')
    .select('season_id, season_year, team_id, team_name, total_points')
    .order('season_year', { ascending: false })
    .order('team_name', { ascending: true })

  if (error || !data) return []
  return data.map((d) => ({ ...d, total_points: Number(d.total_points) }))
}
