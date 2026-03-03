import { z } from 'zod'

const normalizeName = (val: unknown) =>
  typeof val === 'string' ? val.trim().replace(/\s+/g, ' ') : val

export const createPlayerSchema = z.object({
  full_name: z.preprocess(
    normalizeName,
    z.string().min(2, 'Name must be at least 2 characters').max(80, 'Name too long')
  ),
  handicap: z.coerce
    .number({ invalid_type_error: 'Handicap must be a number' })
    .min(-10, 'Handicap cannot be below -10')
    .max(54, 'Handicap cannot exceed 54'),
  is_active: z.boolean().default(true),
})

export const updatePlayerSchema = z.object({
  full_name: z.preprocess(
    normalizeName,
    z.string().min(2, 'Name must be at least 2 characters').max(80, 'Name too long')
  ),
  handicap: z.coerce
    .number({ invalid_type_error: 'Handicap must be a number' })
    .min(-10, 'Handicap cannot be below -10')
    .max(54, 'Handicap cannot exceed 54'),
})

export type CreatePlayerInput = z.infer<typeof createPlayerSchema>
export type UpdatePlayerInput = z.infer<typeof updatePlayerSchema>
