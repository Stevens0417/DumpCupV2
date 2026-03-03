'use server'

import { revalidatePath } from 'next/cache'
import { createRosterSchema, updateRosterSchema } from '@/lib/domain/rosters/rosterSchemas'
import {
  createRoster,
  updateRoster,
  deleteRoster,
  findActiveRosterForPlayer,
} from '@/lib/db/rosters'

type ActionResult = { error: string } | { success: true }

function isFKError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code: string }).code === '23503'
  )
}

export async function createRosterAction(
  seasonId: string,
  formData: FormData
): Promise<ActionResult> {
  const raw = {
    team_id: formData.get('team_id'),
    player_id: formData.get('player_id'),
    handicap_at_draft: formData.get('handicap_at_draft'),
    drafted_at: formData.get('drafted_at'),
    effective_from: formData.get('effective_from'),
    effective_to: formData.get('effective_to'),
    is_celebrity: formData.get('is_celebrity') === 'true',
  }
  const parsed = createRosterSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.errors[0].message }
  }

  const conflict = await findActiveRosterForPlayer(seasonId, parsed.data.player_id)
  if (conflict) {
    return {
      error: `Player already has an active roster entry in this season (from ${conflict.effective_from}). End the existing entry first.`,
    }
  }

  try {
    await createRoster({ season_id: seasonId, ...parsed.data })
    revalidatePath('/admin/draft')
    return { success: true }
  } catch {
    return { error: 'Failed to add roster entry.' }
  }
}

export async function updateRosterAction(
  id: string,
  seasonId: string,
  playerId: string,
  formData: FormData
): Promise<ActionResult> {
  const raw = {
    team_id: formData.get('team_id'),
    handicap_at_draft: formData.get('handicap_at_draft'),
    drafted_at: formData.get('drafted_at'),
    effective_from: formData.get('effective_from'),
    effective_to: formData.get('effective_to'),
    is_celebrity: formData.get('is_celebrity') === 'true',
  }
  const parsed = updateRosterSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.errors[0].message }
  }

  if (!parsed.data.effective_to) {
    const conflict = await findActiveRosterForPlayer(seasonId, playerId, id)
    if (conflict) {
      return {
        error: `Another active entry exists for this player in this season (from ${conflict.effective_from}). End that entry first.`,
      }
    }
  }

  try {
    await updateRoster(id, parsed.data)
    revalidatePath('/admin/draft')
    return { success: true }
  } catch {
    return { error: 'Failed to update roster entry.' }
  }
}

export async function deleteRosterAction(id: string): Promise<ActionResult> {
  try {
    await deleteRoster(id)
    revalidatePath('/admin/draft')
    return { success: true }
  } catch (error) {
    if (isFKError(error)) {
      return { error: 'Cannot delete: this roster entry is referenced by other records.' }
    }
    return { error: 'Failed to delete roster entry.' }
  }
}
