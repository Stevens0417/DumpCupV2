import { z } from 'zod'

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be a valid date (YYYY-MM-DD)')

const optionalDate = z.preprocess(
  (val) => (typeof val === 'string' && val.trim() === '' ? null : val),
  isoDate.nullable()
)

const optionalHandicap = z.preprocess(
  (val) => (typeof val === 'string' && val.trim() === '' ? null : val),
  z.union([
    z.null(),
    z.coerce
      .number({ invalid_type_error: 'Handicap must be a number' })
      .min(-10, 'Handicap cannot be below -10')
      .max(54, 'Handicap cannot exceed 54'),
  ])
)

const baseFields = z.object({
  team_id: z.string().uuid('Invalid team'),
  player_id: z.string().uuid('Invalid player'),
  handicap_at_draft: optionalHandicap,
  drafted_at: optionalDate,
  effective_from: isoDate,
  effective_to: optionalDate,
  is_celebrity: z.boolean().default(false),
})

export const createRosterSchema = baseFields.refine(
  (d) => !d.effective_to || d.effective_to >= d.effective_from,
  { message: 'Effective to must be on or after effective from', path: ['effective_to'] }
)

export const updateRosterSchema = baseFields.omit({ player_id: true }).refine(
  (d) => !d.effective_to || d.effective_to >= d.effective_from,
  { message: 'Effective to must be on or after effective from', path: ['effective_to'] }
)

export type CreateRosterInput = z.infer<typeof createRosterSchema>
export type UpdateRosterInput = z.infer<typeof updateRosterSchema>
