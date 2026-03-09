'use server'

import { revalidatePath } from 'next/cache'
import {
  createMatchWithPlayers,
  updateMatchWithPlayers,
  deleteMatchWithPlayers,
} from '@/lib/db/matches'

type ActionResult = { error: string } | { success: true }

export type YearendMatchInput = {
  tournament_id: string
  season_id: string
  match_date: string
  holes: number
  match_type_id: string
  team_a_id: string
  team_b_id: string
  team_a_handicap: number | null
  team_b_handicap: number | null
  team_a_gross: number | null
  team_b_gross: number | null
  team_a_net: number | null
  team_b_net: number | null
  team_a_points: number
  team_b_points: number
  match_points: number | null
  notes: null
  player_a: { player_id: string; team_id: string; handicap_used: number | null; points_earned: number }
  player_b: { player_id: string; team_id: string; handicap_used: number | null; points_earned: number }
}

function buildRows(input: YearendMatchInput) {
  const { player_a, player_b, ...matchData } = input
  const playerRows = [
    { player_id: player_a.player_id, team_id: player_a.team_id, handicap_used: player_a.handicap_used, points_earned: player_a.points_earned },
    { player_id: player_b.player_id, team_id: player_b.team_id, handicap_used: player_b.handicap_used, points_earned: player_b.points_earned },
  ]
  return { matchData, playerRows }
}

export async function createYearendMatchAction(input: YearendMatchInput): Promise<ActionResult> {
  const { matchData, playerRows } = buildRows(input)
  try {
    await createMatchWithPlayers(matchData, playerRows)
    revalidatePath('/admin/tournaments/yearend')
    revalidatePath('/admin/tournaments')
    return { success: true }
  } catch {
    return { error: 'Failed to create match.' }
  }
}

export async function updateYearendMatchAction(
  id: string,
  input: YearendMatchInput
): Promise<ActionResult> {
  const { matchData, playerRows } = buildRows(input)
  try {
    await updateMatchWithPlayers(id, matchData, playerRows)
    revalidatePath('/admin/tournaments/yearend')
    revalidatePath('/admin/tournaments')
    return { success: true }
  } catch {
    return { error: 'Failed to update match.' }
  }
}

export async function deleteYearendMatchAction(id: string): Promise<ActionResult> {
  try {
    await deleteMatchWithPlayers(id)
    revalidatePath('/admin/tournaments/yearend')
    revalidatePath('/admin/tournaments')
    return { success: true }
  } catch {
    return { error: 'Failed to delete match.' }
  }
}
