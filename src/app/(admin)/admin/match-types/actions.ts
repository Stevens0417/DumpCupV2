'use server'

import { revalidatePath } from 'next/cache'
import { matchTypeSchema } from '@/lib/domain/matchTypes'
import { allocationsSchema } from '@/lib/domain/matchTypeAllocations'
import {
  createMatchType,
  updateMatchType,
  deleteMatchType,
  countMatchesForType,
} from '@/lib/db/matchTypes'
import { upsertAllocations, deleteAllocations } from '@/lib/db/matchTypeAllocations'

type ActionResult = { error: string } | { success: true }

function isDuplicateError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code: string }).code === '23505'
  )
}

export async function createMatchTypeAction(formData: FormData): Promise<ActionResult> {
  const raw = {
    name: formData.get('name'),
    players_per_team: formData.get('players_per_team'),
    handicap_allowance: formData.get('handicap_allowance'),
    notes: formData.get('notes'),
  }
  const parsed = matchTypeSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.errors[0].message }
  }
  try {
    await createMatchType(parsed.data)
    revalidatePath('/admin/match-types')
    return { success: true }
  } catch (error) {
    if (isDuplicateError(error)) {
      return { error: 'A match type with that name already exists.' }
    }
    return { error: 'Failed to create match type.' }
  }
}

export async function updateMatchTypeAction(
  id: string,
  formData: FormData
): Promise<ActionResult> {
  const raw = {
    name: formData.get('name'),
    players_per_team: formData.get('players_per_team'),
    handicap_allowance: formData.get('handicap_allowance'),
    notes: formData.get('notes'),
  }
  const parsed = matchTypeSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.errors[0].message }
  }
  try {
    await updateMatchType(id, parsed.data)
    revalidatePath('/admin/match-types')
    return { success: true }
  } catch (error) {
    if (isDuplicateError(error)) {
      return { error: 'A match type with that name already exists.' }
    }
    return { error: 'Failed to update match type.' }
  }
}

export async function deleteMatchTypeAction(id: string): Promise<ActionResult> {
  try {
    const matchCount = await countMatchesForType(id)
    if (matchCount > 0) {
      return { error: `Cannot delete: used in ${matchCount} match${matchCount > 1 ? 'es' : ''}.` }
    }
    await deleteAllocations(id)
    await deleteMatchType(id)
    revalidatePath('/admin/match-types')
    return { success: true }
  } catch {
    return { error: 'Failed to delete match type.' }
  }
}

export async function saveAllocationsAction(
  matchTypeId: string,
  rows: Array<{ rank_order: number; percentage_weight: number }>
): Promise<ActionResult> {
  const parsed = allocationsSchema.safeParse(rows)
  if (!parsed.success) {
    return { error: parsed.error.errors[0].message }
  }
  try {
    await upsertAllocations(matchTypeId, parsed.data)
    revalidatePath('/admin/match-types')
    return { success: true }
  } catch {
    return { error: 'Failed to save allocations.' }
  }
}
