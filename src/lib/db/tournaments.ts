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

export async function setTournamentStatus(id: string, status: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('tournaments').update({ status }).eq('id', id)
  if (error) throw error
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

// ── Public view types ─────────────────────────────────────────────────────────

export type TournamentSummaryRow = {
  tournament_id: string
  season_id: string
  season_year: number
  tournament_type: 'kickoff' | 'midseason' | 'yearend'
  tournament_date: string | null
  course: string | null
  poster_url: string | null
  team_id: string
  team_name: string
  team_points: number
}

export type KickoffResultRow = {
  tournament_id: string
  season_id: string
  season_year: number
  tournament_date: string | null
  course: string | null
  poster_url: string | null
  player_id: string
  player_name: string
  team_id: string
  team_name: string
  gross_score: number | null
  handicap_used: number | null
  net_score: number | null
  finish_position: number | null
  points_awarded: number | null
  display_rank: number
}

export type TournamentMatchResultRow = {
  tournament_id: string
  season_id: string
  season_year: number
  tournament_type: 'midseason' | 'yearend'
  tournament_date: string | null
  course: string | null
  poster_url: string | null
  match_id: string
  match_date: string | null
  holes: number | null
  match_type_id: string
  match_type_name: string
  team_a_id: string
  team_a_name: string
  team_a_handicap: number | null
  team_a_gross: number | null
  team_a_net: number | null
  team_a_points: number | null
  team_b_id: string
  team_b_name: string
  team_b_handicap: number | null
  team_b_gross: number | null
  team_b_net: number | null
  team_b_points: number | null
  match_points: number | null
  notes: string | null
  winner_name: string | null
}

export type TournamentMatchPlayerRow = {
  tournament_id: string
  match_id: string
  match_type_name: string
  team_id: string
  team_name: string
  player_id: string
  player_name: string
  handicap_used: number | null
  points_earned: number | null
}

// ── Public view queries ───────────────────────────────────────────────────────

export async function getTournamentSummaryAllSeasons(): Promise<TournamentSummaryRow[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('v_tournament_summary')
    .select(
      'tournament_id, season_id, season_year, tournament_type, tournament_date, course, poster_url, team_id, team_name, team_points',
    )
    .order('season_year', { ascending: false })
    .order('tournament_date', { ascending: false })
    .order('team_name', { ascending: true })
  if (error || !data) return []
  return data.map((d) => ({ ...d, team_points: Number(d.team_points) }))
}

export async function getKickoffResultsAllSeasons(): Promise<KickoffResultRow[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('v_kickoff_results')
    .select(
      'tournament_id, season_id, season_year, tournament_date, course, poster_url, player_id, player_name, team_id, team_name, gross_score, handicap_used, net_score, finish_position, points_awarded, display_rank',
    )
    .order('season_year', { ascending: false })
    .order('tournament_date', { ascending: false })
    .order('display_rank', { ascending: true })
  if (error || !data) return []
  return data.map((d) => ({
    ...d,
    handicap_used: d.handicap_used != null ? Number(d.handicap_used) : null,
    points_awarded: d.points_awarded != null ? Number(d.points_awarded) : null,
    display_rank: Number(d.display_rank),
  }))
}

export async function getTournamentMatchResultsAllSeasons(): Promise<TournamentMatchResultRow[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('v_tournament_match_results')
    .select(
      'tournament_id, season_id, season_year, tournament_type, tournament_date, course, poster_url, match_id, match_date, holes, match_type_id, match_type_name, team_a_id, team_a_name, team_a_handicap, team_a_gross, team_a_net, team_a_points, team_b_id, team_b_name, team_b_handicap, team_b_gross, team_b_net, team_b_points, match_points, notes, winner_name',
    )
    .order('season_year', { ascending: false })
    .order('tournament_date', { ascending: false })
    .order('match_date', { ascending: true })
  if (error || !data) return []
  return data.map((d) => ({
    ...d,
    team_a_points: d.team_a_points != null ? Number(d.team_a_points) : null,
    team_b_points: d.team_b_points != null ? Number(d.team_b_points) : null,
    match_points: d.match_points != null ? Number(d.match_points) : null,
  }))
}

export async function getAllTournamentStatuses(): Promise<Record<string, string>> {
  const supabase = createClient()
  const { data, error } = await supabase.from('tournaments').select('id, status')
  if (error) throw error
  return Object.fromEntries((data ?? []).map((t) => [t.id, t.status]))
}

// ── Setup-mode public queries ─────────────────────────────────────────────────

export type KickoffParticipantRow = {
  tournament_id: string
  season_year: number
  player_id: string
  player_name: string
  team_id: string | null
  team_name: string | null
  handicap: number
}

export async function getKickoffParticipantsAllSeasons(): Promise<KickoffParticipantRow[]> {
  const supabase = createClient()

  // Find all kickoff tournaments in 'setup' status
  const { data: tournaments, error: te } = await supabase
    .from('tournaments')
    .select('id, season_id, seasons!inner(year)')
    .eq('type', 'kickoff')
    .eq('status', 'setup')
  if (te) throw te
  if (!tournaments?.length) return []

  const tournamentIds = tournaments.map((t) => t.id)
  const seasonYearById = new Map<string, number>(
    tournaments.map((t) => [t.id, (t.seasons as unknown as { year: number }).year]),
  )

  // Fetch entries with player + team info
  const { data: entries, error: ee } = await supabase
    .from('tournament_entries')
    .select('tournament_id, player_id, team_id, handicap_used, players!inner(full_name, handicap), teams(name)')
    .in('tournament_id', tournamentIds)
    .is('gross_score', null)
  if (ee) throw ee

  return (entries ?? []).map((e) => {
    const player = e.players as unknown as { full_name: string; handicap: number }
    const team = e.teams as unknown as { name: string } | null
    return {
      tournament_id: e.tournament_id,
      season_year: seasonYearById.get(e.tournament_id) ?? 0,
      player_id: e.player_id,
      player_name: player.full_name,
      team_id: e.team_id ?? null,
      team_name: team?.name ?? null,
      handicap: (e.handicap_used as number | null) ?? player.handicap,
    }
  })
}

export type PositionPointsPublicRow = {
  tournament_id: string
  finish_position: number
  points: number
}

export async function getPositionPointsAllSeasons(): Promise<PositionPointsPublicRow[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('tournament_position_points')
    .select('tournament_id, finish_position, points')
    .order('tournament_id')
    .order('finish_position', { ascending: true })
  if (error) throw error
  return (data ?? []).map((r) => ({ ...r, points: Number(r.points) }))
}

export async function getTournamentMatchPlayersAllSeasons(): Promise<TournamentMatchPlayerRow[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('v_tournament_match_players')
    .select(
      'tournament_id, match_id, match_type_name, team_id, team_name, player_id, player_name, handicap_used, points_earned',
    )
    .order('season_year', { ascending: false })
  if (error || !data) return []
  return data.map((d) => ({
    ...d,
    handicap_used: d.handicap_used != null ? Number(d.handicap_used) : null,
    points_earned: d.points_earned != null ? Number(d.points_earned) : null,
  }))
}
