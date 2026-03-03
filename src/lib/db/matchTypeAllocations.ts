import { createClient } from '@/lib/supabase/server'
import type { MatchTypeAllocation } from '@/types/database'

export async function listAllocations(matchTypeId: string): Promise<MatchTypeAllocation[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('match_type_allocations')
    .select('*')
    .eq('match_type_id', matchTypeId)
    .order('rank_order', { ascending: true })
  if (error) throw error
  return data ?? []
}

export async function upsertAllocations(
  matchTypeId: string,
  rows: Array<{ rank_order: number; percentage_weight: number }>
): Promise<void> {
  const supabase = createClient()
  const { error: deleteError } = await supabase
    .from('match_type_allocations')
    .delete()
    .eq('match_type_id', matchTypeId)
  if (deleteError) throw deleteError
  if (rows.length === 0) return
  const { error: insertError } = await supabase
    .from('match_type_allocations')
    .insert(rows.map((r) => ({ match_type_id: matchTypeId, ...r })))
  if (insertError) throw insertError
}

export async function deleteAllocations(matchTypeId: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('match_type_allocations')
    .delete()
    .eq('match_type_id', matchTypeId)
  if (error) throw error
}
