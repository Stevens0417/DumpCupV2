import { createClient } from '@/lib/supabase/server'
import type { Tournament } from '@/types/database'

export async function getTournamentById(id: string): Promise<Tournament | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('tournaments')
    .select('*')
    .eq('id', id)
    .maybeSingle()
  if (error) throw error
  return data
}

export async function getTournamentBySeasonAndType(
  seasonId: string,
  type: 'kickoff' | 'midseason' | 'yearend'
): Promise<Tournament | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('tournaments')
    .select('*')
    .eq('season_id', seasonId)
    .eq('type', type)
    .maybeSingle()
  if (error) throw error
  return data
}

export async function createTournamentIfMissing(
  seasonId: string,
  type: 'kickoff' | 'midseason' | 'yearend'
): Promise<Tournament> {
  const existing = await getTournamentBySeasonAndType(seasonId, type)
  if (existing) return existing
  return createTournament({
    season_id: seasonId,
    type,
    tournament_date: null,
    course: null,
    poster_url: null,
  })
}

export async function listTournamentsBySeason(seasonId: string): Promise<Tournament[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('tournaments')
    .select('*')
    .eq('season_id', seasonId)
    .order('tournament_date', { ascending: true })
  if (error) throw error
  return data ?? []
}

type TournamentInsert = {
  season_id: string
  type: 'kickoff' | 'midseason' | 'yearend'
  tournament_date: string | null
  course: string | null
  poster_url: string | null
}

export async function createTournament(data: TournamentInsert): Promise<Tournament> {
  const supabase = createClient()
  const { data: row, error } = await supabase
    .from('tournaments')
    .insert(data)
    .select()
    .single()
  if (error) throw error
  return row
}

export async function updateTournament(
  id: string,
  data: Omit<TournamentInsert, 'season_id' | 'type'>
): Promise<Tournament> {
  const supabase = createClient()
  const { data: row, error } = await supabase
    .from('tournaments')
    .update(data)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return row
}

export async function deleteTournament(id: string): Promise<void> {
  const supabase = createClient()

  const { error: e1 } = await supabase
    .from('tournament_entries')
    .delete()
    .eq('tournament_id', id)
  if (e1) throw e1

  const { error: e2 } = await supabase
    .from('tournament_position_points')
    .delete()
    .eq('tournament_id', id)
  if (e2) throw e2

  const { error } = await supabase.from('tournaments').delete().eq('id', id)
  if (error) throw error
}
