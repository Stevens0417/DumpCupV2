import { createClient } from '@/lib/supabase/server'
import type { Team } from '@/types/database'

export async function listTeamsBySeason(seasonId: string): Promise<Team[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('teams')
    .select('*')
    .eq('season_id', seasonId)
    .order('name', { ascending: true })
  if (error) throw error
  return data ?? []
}

export async function createTeam(input: {
  season_id: string
  name: string
  captain_name: string | null
  captain_player_id: string | null
  color_primary: string | null
  color_secondary: string | null
}): Promise<Team> {
  const supabase = createClient()
  const { data, error } = await supabase.from('teams').insert(input).select().single()
  if (error) throw error
  return data
}

export async function updateTeam(
  id: string,
  input: {
    name: string
    captain_name: string | null
    captain_player_id: string | null
    color_primary: string | null
    color_secondary: string | null
  }
): Promise<Team> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('teams')
    .update(input)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteTeam(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('teams').delete().eq('id', id)
  if (error) throw error
}
