import { createClient } from '@/lib/supabase/server'

export type PlayerNetPoints = {
  season_id: string
  season_year: number
  player_id: string
  player_name: string
  points_won: number
  points_lost: number
  net_points: number
}

export async function getAllPlayerNetPoints(): Promise<PlayerNetPoints[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('v_player_season_net_points')
    .select('season_id, season_year, player_id, player_name, points_won, points_lost, net_points')
    .order('season_year', { ascending: false })

  if (error || !data) return []

  return data.map((d) => ({
    season_id: d.season_id,
    season_year: Number(d.season_year),
    player_id: d.player_id,
    player_name: d.player_name,
    points_won: Number(d.points_won),
    points_lost: Number(d.points_lost),
    net_points: Number(d.net_points),
  }))
}
