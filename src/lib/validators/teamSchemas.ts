import { z } from 'zod'

function trimOrNull(val: unknown): string | null {
  if (typeof val !== 'string') return null
  const trimmed = val.trim()
  return trimmed || null
}

const nullableHex = z.preprocess(
  trimOrNull,
  z.union([
    z.null(),
    z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Must be a hex color like #FF0000'),
  ])
)

export const TEAM_NAMES = ['Dresden', 'York'] as const
export type TeamName = (typeof TEAM_NAMES)[number]

export const teamSchema = z.object({
  name: z.enum(TEAM_NAMES, {
    errorMap: () => ({ message: 'Team name must be Dresden or York' }),
  }),
  captain_player_id: z.preprocess(
    trimOrNull,
    z.string().uuid('Invalid player ID').nullable()
  ),
  color_primary: nullableHex,
  color_secondary: nullableHex,
})

export type TeamInput = z.infer<typeof teamSchema>
