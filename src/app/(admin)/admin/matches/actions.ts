'use server'

import { revalidatePath } from 'next/cache'
import {
  createMatchWithPlayers,
  updateMatchWithPlayers,
  deleteMatchWithPlayers,
  listMatchPlayersByMatch,
} from '@/lib/db/matches'
import { listAllocations } from '@/lib/db/matchTypeAllocations'
import type { MatchPlayer, MatchTypeAllocation } from '@/types/database'

type ActionResult = { error: string } | { success: true }

export type MatchActionInput = {
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
  tournament_id: string | null
  notes: string | null
  team_a_players: Array<{ player_id: string; handicap_used: number | null; points_earned: number }>
  team_b_players: Array<{ player_id: string; handicap_used: number | null; points_earned: number }>
}

function buildPlayerRows(
  players: MatchActionInput['team_a_players'],
  teamId: string
) {
  return players.map((p) => ({
    player_id: p.player_id,
    team_id: teamId,
    handicap_used: p.handicap_used,
    points_earned: p.points_earned,
  }))
}

export async function createMatchAction(input: MatchActionInput): Promise<ActionResult> {
  const { team_a_players, team_b_players, ...matchData } = input
  try {
    const playerRows = [
      ...buildPlayerRows(team_a_players, input.team_a_id),
      ...buildPlayerRows(team_b_players, input.team_b_id),
    ]
    await createMatchWithPlayers(matchData, playerRows)
    revalidatePath('/admin/matches')
    return { success: true }
  } catch {
    return { error: 'Failed to create match.' }
  }
}

export async function updateMatchAction(
  id: string,
  input: MatchActionInput
): Promise<ActionResult> {
  const { team_a_players, team_b_players, ...matchData } = input
  try {
    const playerRows = [
      ...buildPlayerRows(team_a_players, input.team_a_id),
      ...buildPlayerRows(team_b_players, input.team_b_id),
    ]
    await updateMatchWithPlayers(id, matchData, playerRows)
    revalidatePath('/admin/matches')
    return { success: true }
  } catch {
    return { error: 'Failed to update match.' }
  }
}

export async function deleteMatchAction(id: string): Promise<ActionResult> {
  try {
    await deleteMatchWithPlayers(id)
    revalidatePath('/admin/matches')
    return { success: true }
  } catch {
    return { error: 'Failed to delete match.' }
  }
}

export async function getMatchPlayersAction(
  matchId: string
): Promise<{ data: MatchPlayer[] } | { error: string }> {
  try {
    const data = await listMatchPlayersByMatch(matchId)
    return { data }
  } catch {
    return { error: 'Failed to load match players.' }
  }
}

export async function getMatchTypeAllocationsAction(
  matchTypeId: string
): Promise<{ data: MatchTypeAllocation[] } | { error: string }> {
  try {
    const data = await listAllocations(matchTypeId)
    return { data }
  } catch {
    return { error: 'Failed to load match type weights.' }
  }
}
