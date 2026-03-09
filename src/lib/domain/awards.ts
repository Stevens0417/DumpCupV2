import { z } from 'zod'

export const AWARD_TYPES = [
  'league_winner',
  'mvp',
  'most_unimproved',
  'most_improved',
  'low_gross',
  'low_net',
  'other',
] as const

export const AWARD_LABELS: Record<(typeof AWARD_TYPES)[number], string> = {
  league_winner: 'League Winner',
  mvp: 'MVP',
  most_unimproved: 'Most Unimproved',
  most_improved: 'Most Improved',
  low_gross: 'Low Gross',
  low_net: 'Low Net',
  other: 'Other',
}

export const awardSchema = z.object({
  award: z.enum(AWARD_TYPES),
  team_id: z.string().uuid().nullable().optional().transform((v) => v ?? null),
  team_captain: z
    .string()
    .max(200)
    .nullable()
    .optional()
    .transform((v) => v || null),
  final_score: z
    .string()
    .max(100)
    .nullable()
    .optional()
    .transform((v) => v || null),
  player_id: z.string().uuid().nullable().optional().transform((v) => v ?? null),
  net_points: z.number().nullable().optional().transform((v) => v ?? null),
  notes: z
    .string()
    .max(1000)
    .nullable()
    .optional()
    .transform((v) => v || null),
})

export type AwardFormData = z.infer<typeof awardSchema>
