'use server'

import { revalidatePath } from 'next/cache'
import { getActiveRosterByPlayer, executeTrade } from '@/lib/db/trades'
import { tradeSchema } from '@/lib/domain/trades'

type ActionResult = { error: string } | { success: true }

export type TradeInput = {
  player_id: string
  new_team_id: string
  trade_date: string
  handicap_at_trade: number | null
}

function subtractOneDay(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  const dt = new Date(y, m - 1, d - 1)
  const yy = dt.getFullYear()
  const mm = String(dt.getMonth() + 1).padStart(2, '0')
  const dd = String(dt.getDate()).padStart(2, '0')
  return `${yy}-${mm}-${dd}`
}

export async function executeTradeAction(
  seasonId: string,
  input: TradeInput
): Promise<ActionResult> {
  const parsed = tradeSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.errors[0].message }

  const { player_id, new_team_id, trade_date, handicap_at_trade } = parsed.data

  const oldRoster = await getActiveRosterByPlayer(seasonId, player_id)
  if (!oldRoster) return { error: 'Player has no active roster in this season.' }
  if (oldRoster.team_id === new_team_id)
    return { error: 'New team must differ from current team.' }
  if (trade_date < oldRoster.effective_from)
    return { error: "Trade date cannot be before the player's current roster start date." }

  const effectiveTo = subtractOneDay(trade_date)

  try {
    await executeTrade({
      oldRosterId: oldRoster.id,
      effectiveTo,
      season_id: seasonId,
      team_id: new_team_id,
      player_id,
      handicap_at_draft: handicap_at_trade,
      drafted_at: oldRoster.drafted_at,
      effective_from: trade_date,
      is_celebrity: oldRoster.is_celebrity,
    })
    revalidatePath('/admin/trades')
    return { success: true }
  } catch {
    return { error: 'Failed to execute trade.' }
  }
}
