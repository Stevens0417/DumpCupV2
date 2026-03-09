import { createClient } from '@/lib/supabase/server'
import type { Award, AwardType } from '@/types/database'

type AwardInsert = {
  season_id: string
  award: AwardType
  team_id: string | null
  team_captain: string | null
  final_score: string | null
  player_id: string | null
  net_points: number | null
  notes: string | null
}

export async function listAwardsBySeason(seasonId: string): Promise<Award[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('awards')
    .select('*')
    .eq('season_id', seasonId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return data ?? []
}

export async function createAward(payload: AwardInsert): Promise<Award> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('awards')
    .insert(payload)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateAward(
  id: string,
  payload: Omit<AwardInsert, 'season_id'>
): Promise<Award> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('awards')
    .update(payload)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteAward(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('awards').delete().eq('id', id)
  if (error) throw error
}
