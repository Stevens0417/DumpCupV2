'use server'

import { revalidatePath } from 'next/cache'
import { createAward, updateAward, deleteAward } from '@/lib/db/awards'
import { awardSchema } from '@/lib/domain/awards'
import type { AwardType } from '@/types/database'

type ActionResult = { error: string } | { success: true }

export type AwardInput = {
  award: AwardType
  team_id: string | null
  team_captain: string | null
  final_score: string | null
  player_id: string | null
  net_points: number | null
  notes: string | null
}

function revalidate() {
  revalidatePath('/admin/awards')
}

export async function createAwardAction(
  seasonId: string,
  input: AwardInput
): Promise<ActionResult> {
  const parsed = awardSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.errors[0].message }
  try {
    await createAward({ season_id: seasonId, ...parsed.data })
    revalidate()
    return { success: true }
  } catch {
    return { error: 'Failed to create award.' }
  }
}

export async function updateAwardAction(
  id: string,
  input: AwardInput
): Promise<ActionResult> {
  const parsed = awardSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.errors[0].message }
  try {
    await updateAward(id, parsed.data)
    revalidate()
    return { success: true }
  } catch {
    return { error: 'Failed to update award.' }
  }
}

export async function deleteAwardAction(id: string): Promise<ActionResult> {
  try {
    await deleteAward(id)
    revalidate()
    return { success: true }
  } catch {
    return { error: 'Failed to delete award.' }
  }
}
