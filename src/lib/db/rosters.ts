import { createClient } from '@/lib/supabase/server'
import type { Roster } from '@/types/database'

export async function listRostersBySeason(seasonId: string): Promise<Roster[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('rosters')
    .select('*')
    .eq('season_id', seasonId)
    .order('team_id')
    .order('player_id')
  if (error) throw error
  return data ?? []
}

export async function findActiveRosterForPlayer(
  seasonId: string,
  playerId: string,
  excludeId?: string
): Promise<{ id: string; effective_from: string } | null> {
  const supabase = createClient()
  const base = supabase
    .from('rosters')
    .select('id, effective_from')
    .eq('season_id', seasonId)
    .eq('player_id', playerId)
    .is('effective_to', null)
    .limit(1)
  const { data } = excludeId
    ? await base.neq('id', excludeId).maybeSingle()
    : await base.maybeSingle()
  return data
}

export async function createRoster(input: {
  season_id: string
  team_id: string
  player_id: string
  handicap_at_draft: number | null
  drafted_at: string | null
  effective_from: string
  effective_to: string | null
  is_celebrity: boolean
}): Promise<Roster> {
  const supabase = createClient()
  const { data, error } = await supabase.from('rosters').insert(input).select().single()
  if (error) throw error
  return data
}

export async function updateRoster(
  id: string,
  input: {
    team_id: string
    handicap_at_draft: number | null
    drafted_at: string | null
    effective_from: string
    effective_to: string | null
    is_celebrity: boolean
  }
): Promise<Roster> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('rosters')
    .update(input)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteRoster(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('rosters').delete().eq('id', id)
  if (error) throw error
}
