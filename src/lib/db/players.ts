import { createClient } from '@/lib/supabase/server'
import type { Player } from '@/types/database'

export async function listPlayers(): Promise<Player[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('players')
    .select('*')
    .order('full_name', { ascending: true })
  if (error) throw error
  return data ?? []
}

export async function listActivePlayers(): Promise<Player[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('players')
    .select('*')
    .eq('is_active', true)
    .order('full_name', { ascending: true })
  if (error) throw error
  return data ?? []
}

export async function createPlayer(input: {
  full_name: string
  handicap: number
  is_active: boolean
}): Promise<Player> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('players')
    .insert(input)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updatePlayer(
  id: string,
  input: { full_name: string; handicap: number }
): Promise<Player> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('players')
    .update(input)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function setPlayerActive(id: string, is_active: boolean): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('players').update({ is_active }).eq('id', id)
  if (error) throw error
}

export async function getPlayerById(id: string): Promise<Player | null> {
  const supabase = createClient()
  const { data, error } = await supabase.from('players').select('*').eq('id', id).maybeSingle()
  if (error) throw error
  return data
}
