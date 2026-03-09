import { z } from 'zod'

export const tournamentEntrySchema = z.object({
  player_id: z.string().uuid('Invalid player'),
  team_id: z.preprocess(
    (val) => (typeof val === 'string' ? val.trim() || null : null),
    z.string().uuid().nullable()
  ),
  gross_score: z.preprocess(
    (val) => (val === '' || val === null || val === undefined ? null : val),
    z.coerce.number().int().min(18).max(200).nullable()
  ),
  handicap_used: z.preprocess(
    (val) => (val === '' || val === null || val === undefined ? null : val),
    z.coerce.number().min(0).max(54).nullable()
  ),
  finish_position: z.preprocess(
    (val) => (val === '' || val === null || val === undefined ? null : val),
    z.coerce.number().int().min(1).nullable()
  ),
  points_awarded: z.preprocess(
    (val) => (val === '' || val === null || val === undefined ? null : val),
    z.coerce.number().min(0).nullable()
  ),
})

export type TournamentEntryInput = z.infer<typeof tournamentEntrySchema>
