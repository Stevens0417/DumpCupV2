import { z } from 'zod'

export const tradeSchema = z.object({
  player_id: z.string().uuid(),
  new_team_id: z.string().uuid(),
  trade_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Trade date must be YYYY-MM-DD'),
  handicap_at_trade: z
    .number()
    .nullable()
    .optional()
    .transform((v) => v ?? null),
})

export type TradeFormData = z.infer<typeof tradeSchema>
