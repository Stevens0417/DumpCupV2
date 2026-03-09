'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import {
  createGalleryImage,
  updateGalleryImage,
  deleteGalleryImage,
  swapGalleryOrder,
  getNextPositionOrder,
} from '@/lib/db/gallery'

type ActionResult = { error: string } | { success: true }
type DeleteResult = { error: string } | { success: true; storageWarning?: string }

function revalidate() {
  revalidatePath('/admin/gallery')
}

function extractStoragePath(imageUrl: string): string | null {
  const prefix = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/gallery/`
  if (imageUrl.startsWith(prefix)) {
    return imageUrl.slice(prefix.length)
  }
  return null
}

export async function saveGalleryImageAction(input: {
  publicUrl: string
  seasonId: string | null
  caption: string | null
}): Promise<ActionResult> {
  try {
    const positionOrder = await getNextPositionOrder()
    await createGalleryImage({
      season_id: input.seasonId,
      image_url: input.publicUrl,
      thumbnail_url: input.publicUrl,
      position_order: positionOrder,
      caption: input.caption,
    })
    revalidate()
    return { success: true }
  } catch {
    return { error: 'Failed to save image metadata.' }
  }
}

export async function updateGalleryImageAction(
  id: string,
  caption: string | null,
  seasonId: string | null
): Promise<ActionResult> {
  try {
    await updateGalleryImage(id, { caption, season_id: seasonId })
    revalidate()
    return { success: true }
  } catch {
    return { error: 'Failed to update image.' }
  }
}

export async function deleteGalleryImageAction(
  id: string,
  imageUrl: string
): Promise<DeleteResult> {
  try {
    await deleteGalleryImage(id)
  } catch {
    return { error: 'Failed to delete image record.' }
  }

  // Try to delete from storage
  const storagePath = extractStoragePath(imageUrl)
  if (storagePath) {
    const supabase = createClient()
    const { error: storageError } = await supabase.storage
      .from('gallery')
      .remove([storagePath])
    if (storageError) {
      revalidate()
      return {
        success: true,
        storageWarning: 'Image record deleted, but file could not be removed from storage.',
      }
    }
  }

  revalidate()
  return { success: true }
}

export async function swapGalleryOrderAction(
  id1: string,
  order1: number,
  id2: string,
  order2: number
): Promise<ActionResult> {
  try {
    await swapGalleryOrder(id1, order1, id2, order2)
    revalidate()
    return { success: true }
  } catch {
    return { error: 'Failed to reorder images.' }
  }
}
