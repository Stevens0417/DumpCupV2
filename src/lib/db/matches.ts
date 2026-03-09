import { createClient } from '@/lib/supabase/server'
import type { Match, MatchPlayer } from '@/types/database'

export async function listMatchesBySeason(seasonId: string): Promise<Match[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('matches')
    .select('*')
    .eq('season_id', seasonId)
    .order('match_date', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function listMatchPlayersByMatch(matchId: string): Promise<MatchPlayer[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('match_players')
    .select('*')
    .eq('match_id', matchId)
  if (error) throw error
  return data ?? []
}

type MatchInsert = {
  season_id: string
  match_date: string
  holes: number
  match_type_id: string
  team_a_id: string
  team_b_id: string
  team_a_handicap: number | null
  team_b_handicap: number | null
  team_a_gross: number | null
  team_b_gross: number | null
  team_a_net: number | null
  team_b_net: number | null
  team_a_points: number
  team_b_points: number
  match_points?: number | null
  tournament_id: string | null
  notes: string | null
}

type MatchPlayerInsert = {
  player_id: string
  team_id: string
  handicap_used: number | null
  points_earned: number
}

export async function createMatchWithPlayers(
  matchData: MatchInsert,
  players: MatchPlayerInsert[]
): Promise<Match> {
  const supabase = createClient()
  const { data: match, error: matchError } = await supabase
    .from('matches')
    .insert(matchData)
    .select()
    .single()
  if (matchError) throw matchError

  if (players.length > 0) {
    const { error: playersError } = await supabase
      .from('match_players')
      .insert(players.map((p) => ({ match_id: match.id, ...p })))
    if (playersError) throw playersError
  }
  return match
}

export async function updateMatchWithPlayers(
  id: string,
  matchData: MatchInsert,
  players: MatchPlayerInsert[]
): Promise<Match> {
  const supabase = createClient()
  const { data: match, error: matchError } = await supabase
    .from('matches')
    .update(matchData)
    .eq('id', id)
    .select()
    .single()
  if (matchError) throw matchError

  const { error: deleteError } = await supabase
    .from('match_players')
    .delete()
    .eq('match_id', id)
  if (deleteError) throw deleteError

  if (players.length > 0) {
    const { error: playersError } = await supabase
      .from('match_players')
      .insert(players.map((p) => ({ match_id: id, ...p })))
    if (playersError) throw playersError
  }
  return match
}

export async function listMatchesByTournament(tournamentId: string): Promise<Match[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('matches')
    .select('*')
    .eq('tournament_id', tournamentId)
    .order('match_date', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function listMatchPlayersByMatchIds(matchIds: string[]): Promise<MatchPlayer[]> {
  if (matchIds.length === 0) return []
  const supabase = createClient()
  const { data, error } = await supabase
    .from('match_players')
    .select('*')
    .in('match_id', matchIds)
  if (error) throw error
  return data ?? []
}

export async function deleteMatchWithPlayers(id: string): Promise<void> {
  const supabase = createClient()
  const { error: deletePlayersError } = await supabase
    .from('match_players')
    .delete()
    .eq('match_id', id)
  if (deletePlayersError) throw deletePlayersError

  const { error } = await supabase.from('matches').delete().eq('id', id)
  if (error) throw error
}
