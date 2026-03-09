import { z } from 'zod'

export const positionPointsRowSchema = z.object({
  finish_position: z.coerce.number().int().min(1),
  points: z.coerce.number().min(0),
})

export const positionPointsTableSchema = z.array(positionPointsRowSchema)

export type PositionPointsRow = z.infer<typeof positionPointsRowSchema>

/**
 * Looks up points for a given finish position from a sorted mapping.
 * Returns null if no mapping exists for that position.
 */
export function lookupPointsForPosition(
  position: number,
  mapping: { finish_position: number; points: number }[]
): number | null {
  const row = mapping.find((r) => r.finish_position === position)
  return row?.points ?? null
}
