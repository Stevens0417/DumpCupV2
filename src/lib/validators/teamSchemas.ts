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

export const teamSchema = z.object({
  name: z.preprocess(
    (val) => (typeof val === 'string' ? val.trim().replace(/\s+/g, ' ') : val),
    z.string().min(2, 'Name must be at least 2 characters').max(40, 'Name too long')
  ),
  captain_name: z.preprocess(trimOrNull, z.string().max(60, 'Captain name too long').nullable()),
  color_primary: nullableHex,
  color_secondary: nullableHex,
})

export type TeamInput = z.infer<typeof teamSchema>
