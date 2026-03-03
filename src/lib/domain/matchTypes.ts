import { z } from 'zod'

export const matchTypeSchema = z.object({
  name: z.preprocess(
    (val) => (typeof val === 'string' ? val.trim().replace(/\s+/g, ' ') : val),
    z.string().min(2, 'Name must be at least 2 characters').max(40, 'Name too long')
  ),
  players_per_team: z.coerce
    .number({ invalid_type_error: 'Players per team must be a number' })
    .int('Must be a whole number')
    .min(1, 'Min 1 player per team')
    .max(4, 'Max 4 players per team'),
  handicap_allowance: z.coerce
    .number({ invalid_type_error: 'Handicap allowance must be a number' })
    .min(0, 'Min 0')
    .max(1.0, 'Max 1.0'),
  notes: z.preprocess(
    (val) => (typeof val === 'string' ? val.trim() || null : null),
    z.string().nullable()
  ),
})

export type MatchTypeInput = z.infer<typeof matchTypeSchema>
