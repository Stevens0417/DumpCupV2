import { createClient } from '@/lib/supabase/server'
import type { Roster, DerivedTrade } from '@/types/database'

export async function getActiveRosterByPlayer(
  seasonId: string,
  playerId: string
): Promise<Roster | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('rosters')
    .select('*')
    .eq('season_id', seasonId)
    .eq('player_id', playerId)
    .is('effective_to', null)
    .maybeSingle()
  if (error) throw error
  return data
}

export async function listActiveRostersBySeason(seasonId: string): Promise<Roster[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('rosters')
    .select('*')
    .eq('season_id', seasonId)
    .is('effective_to', null)
    .order('player_id')
  if (error) throw error
  return data ?? []
}

export async function executeTrade(payload: {
  oldRosterId: string
  effectiveTo: string
  season_id: string
  team_id: string
  player_id: string
  handicap_at_draft: number | null
  drafted_at: string | null
  effective_from: string
  is_celebrity: boolean
}): Promise<void> {
  const supabase = createClient()

  const { error: updateError } = await supabase
    .from('rosters')
    .update({ effective_to: payload.effectiveTo })
    .eq('id', payload.oldRosterId)
  if (updateError) throw updateError

  const { error: insertError } = await supabase.from('rosters').insert({
    season_id: payload.season_id,
    team_id: payload.team_id,
    player_id: payload.player_id,
    handicap_at_draft: payload.handicap_at_draft,
    drafted_at: payload.drafted_at,
    effective_from: payload.effective_from,
    effective_to: null,
    is_celebrity: payload.is_celebrity,
  })
  if (insertError) throw insertError
}

export async function listDerivedTradesBySeason(seasonId: string): Promise<DerivedTrade[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('rosters')
    .select('player_id, team_id, effective_from')
    .eq('season_id', seasonId)
    .order('player_id')
    .order('effective_from')
  if (error) throw error

  const rows = data ?? []
  const trades: DerivedTrade[] = []

  for (let i = 1; i < rows.length; i++) {
    const prev = rows[i - 1]
    const curr = rows[i]
    if (curr.player_id === prev.player_id && curr.team_id !== prev.team_id) {
      trades.push({
        player_id: curr.player_id,
        from_team_id: prev.team_id,
        to_team_id: curr.team_id,
        trade_date: curr.effective_from,
      })
    }
  }

  return trades
}
