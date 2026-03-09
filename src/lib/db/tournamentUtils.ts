import { createClient } from '@/lib/supabase/server'
import type { Player } from '@/types/database'

export type PlayerWithTeam = Player & { team_id: string | null }

/**
 * Returns all active players with their team assignment for the given season and date.
 * Uses effective_from / effective_to to find the active roster entry.
 * Players with no roster entry for the period have team_id = null.
 */
export async function getPlayersWithTeams(
  seasonId: string,
  date: string // ISO date string YYYY-MM-DD
): Promise<PlayerWithTeam[]> {
  const supabase = createClient()

  const [{ data: players, error: pe }, { data: rosters, error: re }] = await Promise.all([
    supabase
      .from('players')
      .select('*')
      .eq('is_active', true)
      .order('full_name', { ascending: true }),
    supabase
      .from('rosters')
      .select('player_id, team_id, effective_from, effective_to')
      .eq('season_id', seasonId)
      .lte('effective_from', date),
  ])

  if (pe) throw pe
  if (re) throw re

  // Build map: player_id → team_id (most recent active roster for the date)
  const rosterMap: Record<string, string> = {}
  for (const r of rosters ?? []) {
    if (r.effective_to === null || r.effective_to >= date) {
      rosterMap[r.player_id] = r.team_id
    }
  }

  return (players ?? []).map((p) => ({ ...p, team_id: rosterMap[p.id] ?? null }))
}
