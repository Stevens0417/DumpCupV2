import { createClient } from '@/lib/supabase/server'
import type { TournamentPositionPoints } from '@/types/database'

export async function listPositionPoints(tournamentId: string): Promise<TournamentPositionPoints[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('tournament_position_points')
    .select('*')
    .eq('tournament_id', tournamentId)
    .order('finish_position', { ascending: true })
  if (error) throw error
  return data ?? []
}

export async function upsertPositionPoints(
  tournamentId: string,
  rows: { finish_position: number; points: number }[]
): Promise<void> {
  const supabase = createClient()

  const { error: deleteError } = await supabase
    .from('tournament_position_points')
    .delete()
    .eq('tournament_id', tournamentId)
  if (deleteError) throw deleteError

  if (rows.length === 0) return

  const { error } = await supabase
    .from('tournament_position_points')
    .insert(rows.map((r) => ({ tournament_id: tournamentId, ...r })))
  if (error) throw error
}
