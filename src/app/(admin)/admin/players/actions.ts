'use server'

import { revalidatePath } from 'next/cache'
import { createPlayerSchema, updatePlayerSchema } from '@/lib/validators/playerSchemas'
import { createPlayer, updatePlayer, setPlayerActive } from '@/lib/db/players'

type ActionResult = { error: string } | { success: true }

function isDuplicateNameError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code: string }).code === '23505'
  )
}

export async function createPlayerAction(formData: FormData): Promise<ActionResult> {
  const raw = {
    full_name: formData.get('full_name'),
    handicap: formData.get('handicap'),
    is_active: formData.get('is_active') === 'true',
  }
  const parsed = createPlayerSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.errors[0].message }
  }
  try {
    await createPlayer(parsed.data)
    revalidatePath('/admin/players')
    return { success: true }
  } catch (error) {
    if (isDuplicateNameError(error)) {
      return { error: 'A player with that name already exists.' }
    }
    return { error: 'Failed to create player.' }
  }
}

export async function updatePlayerAction(
  id: string,
  formData: FormData
): Promise<ActionResult> {
  const raw = {
    full_name: formData.get('full_name'),
    handicap: formData.get('handicap'),
  }
  const parsed = updatePlayerSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.errors[0].message }
  }
  try {
    await updatePlayer(id, parsed.data)
    revalidatePath('/admin/players')
    return { success: true }
  } catch (error) {
    if (isDuplicateNameError(error)) {
      return { error: 'A player with that name already exists.' }
    }
    return { error: 'Failed to update player.' }
  }
}

export async function togglePlayerActiveAction(
  id: string,
  is_active: boolean
): Promise<ActionResult> {
  try {
    await setPlayerActive(id, is_active)
    revalidatePath('/admin/players')
    return { success: true }
  } catch {
    return { error: 'Failed to update player status.' }
  }
}
