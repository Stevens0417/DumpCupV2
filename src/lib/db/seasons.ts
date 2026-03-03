import { createClient } from '@/lib/supabase/server'
import type { Season } from '@/types/database'

export async function listSeasons(): Promise<Season[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('seasons')
    .select('*')
    .order('year', { ascending: false })
  if (error) throw error
  return data ?? []
}
