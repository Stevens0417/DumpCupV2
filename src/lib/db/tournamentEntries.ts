import { createClient } from '@/lib/supabase/server'
import type { TournamentEntry } from '@/types/database'

export async function listTournamentEntries(tournamentId: string): Promise<TournamentEntry[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('tournament_entries')
    .select('*')
    .eq('tournament_id', tournamentId)
    .order('finish_position', { ascending: true, nullsFirst: false })
  if (error) throw error
  return data ?? []
}

type EntryInsert = {
  player_id: string
  team_id: string | null
  gross_score: number | null
  handicap_used: number | null
  net_score: number | null
  finish_position: number | null
  points_awarded: number | null
}

export async function createTournamentEntry(
  tournamentId: string,
  data: EntryInsert
): Promise<TournamentEntry> {
  const supabase = createClient()
  const { data: row, error } = await supabase
    .from('tournament_entries')
    .insert({ tournament_id: tournamentId, ...data })
    .select()
    .single()
  if (error) throw error
  return row
}

export async function updateTournamentEntry(
  id: string,
  data: Omit<EntryInsert, 'player_id'>
): Promise<TournamentEntry> {
  const supabase = createClient()
  const { data: row, error } = await supabase
    .from('tournament_entries')
    .update(data)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return row
}

export async function deleteTournamentEntry(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('tournament_entries').delete().eq('id', id)
  if (error) throw error
}

/**
 * Replaces all entries for a tournament in a single delete+insert operation.
 * Only rows in the provided array are saved; any previous entries not in the
 * array are deleted.
 */
export async function replaceAllTournamentEntries(
  tournamentId: string,
  rows: EntryInsert[]
): Promise<void> {
  const supabase = createClient()

  const { error: deleteError } = await supabase
    .from('tournament_entries')
    .delete()
    .eq('tournament_id', tournamentId)
  if (deleteError) throw deleteError

  if (rows.length === 0) return

  const { error } = await supabase
    .from('tournament_entries')
    .insert(rows.map((r) => ({ tournament_id: tournamentId, ...r })))
  if (error) throw error
}
