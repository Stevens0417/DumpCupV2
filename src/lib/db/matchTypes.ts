import { createClient } from '@/lib/supabase/server'
import type { MatchType } from '@/types/database'

export async function listMatchTypes(): Promise<MatchType[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('match_types')
    .select('*')
    .order('name', { ascending: true })
  if (error) throw error
  return data ?? []
}

export async function createMatchType(input: {
  name: string
  players_per_team: number
  handicap_allowance: number
  notes: string | null
}): Promise<MatchType> {
  const supabase = createClient()
  const { data, error } = await supabase.from('match_types').insert(input).select().single()
  if (error) throw error
  return data
}

export async function updateMatchType(
  id: string,
  input: {
    name: string
    players_per_team: number
    handicap_allowance: number
    notes: string | null
  }
): Promise<MatchType> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('match_types')
    .update(input)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteMatchType(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('match_types').delete().eq('id', id)
  if (error) throw error
}

export async function countMatchesForType(id: string): Promise<number> {
  const supabase = createClient()
  const { count, error } = await supabase
    .from('matches')
    .select('id', { count: 'exact', head: true })
    .eq('match_type_id', id)
  if (error) throw error
  return count ?? 0
}
