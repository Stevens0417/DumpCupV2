'use server'

import { revalidatePath } from 'next/cache'
import { teamSchema } from '@/lib/validators/teamSchemas'
import { createTeam, updateTeam, deleteTeam } from '@/lib/db/teams'

type ActionResult = { error: string } | { success: true }

function isDuplicateError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code: string }).code === '23505'
  )
}

function isFKConstraintError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code: string }).code === '23503'
  )
}

export async function createTeamAction(
  seasonId: string,
  formData: FormData
): Promise<ActionResult> {
  const raw = {
    name: formData.get('name'),
    captain_name: formData.get('captain_name'),
    color_primary: formData.get('color_primary'),
    color_secondary: formData.get('color_secondary'),
  }
  const parsed = teamSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.errors[0].message }
  }
  try {
    await createTeam({ season_id: seasonId, ...parsed.data })
    revalidatePath('/admin/teams')
    return { success: true }
  } catch (error) {
    if (isDuplicateError(error)) {
      return { error: 'A team with that name already exists in this season.' }
    }
    return { error: 'Failed to create team.' }
  }
}

export async function updateTeamAction(
  id: string,
  formData: FormData
): Promise<ActionResult> {
  const raw = {
    name: formData.get('name'),
    captain_name: formData.get('captain_name'),
    color_primary: formData.get('color_primary'),
    color_secondary: formData.get('color_secondary'),
  }
  const parsed = teamSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.errors[0].message }
  }
  try {
    await updateTeam(id, parsed.data)
    revalidatePath('/admin/teams')
    return { success: true }
  } catch (error) {
    if (isDuplicateError(error)) {
      return { error: 'A team with that name already exists in this season.' }
    }
    return { error: 'Failed to update team.' }
  }
}

export async function deleteTeamAction(id: string): Promise<ActionResult> {
  try {
    await deleteTeam(id)
    revalidatePath('/admin/teams')
    return { success: true }
  } catch (error) {
    if (isFKConstraintError(error)) {
      return { error: 'Cannot delete: this team is referenced by other records.' }
    }
    return { error: 'Failed to delete team.' }
  }
}
