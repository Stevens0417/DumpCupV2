import { createClient } from '@/lib/supabase/server'
import type { GalleryImage } from '@/types/database'

export async function listGalleryImages(seasonId?: string | null): Promise<GalleryImage[]> {
  const supabase = createClient()
  let query = supabase
    .from('gallery_images')
    .select('*')
    .order('position_order', { ascending: true })
  if (seasonId) {
    query = query.eq('season_id', seasonId)
  }
  const { data, error } = await query
  if (error) throw error
  return data ?? []
}

export async function getNextPositionOrder(): Promise<number> {
  const supabase = createClient()
  const { data } = await supabase
    .from('gallery_images')
    .select('position_order')
    .order('position_order', { ascending: false })
    .limit(1)
    .maybeSingle()
  return (data?.position_order ?? 0) + 1
}

export async function createGalleryImage(payload: {
  season_id: string | null
  image_url: string
  thumbnail_url: string
  position_order: number
  caption: string | null
}): Promise<GalleryImage> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('gallery_images')
    .insert(payload)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateGalleryImage(
  id: string,
  payload: { caption: string | null; season_id: string | null }
): Promise<GalleryImage> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('gallery_images')
    .update(payload)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteGalleryImage(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('gallery_images').delete().eq('id', id)
  if (error) throw error
}

export async function swapGalleryOrder(
  id1: string,
  order1: number,
  id2: string,
  order2: number
): Promise<void> {
  const supabase = createClient()
  const { error: e1 } = await supabase
    .from('gallery_images')
    .update({ position_order: order2 })
    .eq('id', id1)
  if (e1) throw e1
  const { error: e2 } = await supabase
    .from('gallery_images')
    .update({ position_order: order1 })
    .eq('id', id2)
  if (e2) throw e2
}
