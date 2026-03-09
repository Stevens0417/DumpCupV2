import { z } from 'zod'

export const tournamentSchema = z.object({
  tournament_date: z.preprocess(
    (val) => (typeof val === 'string' ? val.trim() || null : null),
    z.string().nullable()
  ),
  course: z.preprocess(
    (val) => (typeof val === 'string' ? val.trim().replace(/\s+/g, ' ') || null : null),
    z.string().max(100, 'Course name too long').nullable()
  ),
  poster_url: z.preprocess(
    (val) => (typeof val === 'string' ? val.trim() || null : null),
    z.string().url('Invalid URL').nullable().or(z.null())
  ),
})

export type TournamentInput = z.infer<typeof tournamentSchema>
