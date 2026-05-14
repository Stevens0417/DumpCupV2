'use server'

import { revalidatePath } from 'next/cache'
import {
  createTournament,
  updateTournament,
  deleteTournament,
  getTournamentBySeasonAndType,
  setTournamentStatus,
} from '@/lib/db/tournaments'
import {
  listPositionPoints,
  upsertPositionPoints,
} from '@/lib/db/tournamentPositionPoints'
import {
  listTournamentEntries,
  createTournamentEntry,
  updateTournamentEntry,
  deleteTournamentEntry,
  replaceAllTournamentEntries,
} from '@/lib/db/tournamentEntries'
import { tournamentSchema } from '@/lib/domain/tournaments'
import type { Tournament, TournamentEntry, TournamentPositionPoints } from '@/types/database'

// ── Inline setup / edit (used by TournamentSelectorClient) ───────────────────

export type SetupResult = { success: true } | { conflict: Tournament } | { error: string }

export async function setupTournamentAction(
  seasonId: string,
  type: 'kickoff' | 'midseason' | 'yearend',
  date: string,
  course: string,
  posterUrl: string
): Promise<SetupResult> {
  if (!date) return { error: 'Date is required.' }
  try {
    await createTournament({
      season_id: seasonId,
      type,
      tournament_date: date,
      course: course || null,
      poster_url: posterUrl || null,
    })
    revalidatePath('/admin/tournaments')
    return { success: true }
  } catch (e: unknown) {
    if (e && typeof e === 'object' && 'code' in e && (e as { code: string }).code === '23505') {
      const existing = await getTournamentBySeasonAndType(seasonId, type)
      if (existing) return { conflict: existing }
    }
    return { error: 'Failed to create tournament.' }
  }
}

export async function editTournamentAction(
  id: string,
  date: string,
  course: string,
  posterUrl: string
): Promise<ActionResult> {
  if (!date) return { error: 'Date is required.' }
  try {
    await updateTournament(id, {
      tournament_date: date,
      course: course || null,
      poster_url: posterUrl || null,
    })
    revalidatePath('/admin/tournaments')
    return { success: true }
  } catch {
    return { error: 'Failed to update tournament.' }
  }
}

type ActionResult = { error: string } | { success: true }

// ── Tournament CRUD ──────────────────────────────────────────────────────────

export async function createTournamentAction(
  seasonId: string,
  type: 'kickoff' | 'midseason' | 'yearend',
  formData: FormData
): Promise<ActionResult> {
  const raw = {
    tournament_date: formData.get('tournament_date'),
    course: formData.get('course'),
    poster_url: formData.get('poster_url'),
  }
  const parsed = tournamentSchema.safeParse(raw)
  if (!parsed.success) return { error: parsed.error.errors[0].message }

  try {
    await createTournament({ season_id: seasonId, type, ...parsed.data })
    revalidatePath('/admin/tournaments')
    return { success: true }
  } catch (e: unknown) {
    if (e && typeof e === 'object' && 'code' in e && e.code === '23505') {
      return { error: `A ${type} tournament already exists for this season.` }
    }
    return { error: 'Failed to create tournament.' }
  }
}

export async function updateTournamentAction(
  id: string,
  formData: FormData
): Promise<ActionResult> {
  const raw = {
    tournament_date: formData.get('tournament_date'),
    course: formData.get('course'),
    poster_url: formData.get('poster_url'),
  }
  const parsed = tournamentSchema.safeParse(raw)
  if (!parsed.success) return { error: parsed.error.errors[0].message }

  try {
    await updateTournament(id, parsed.data)
    revalidatePath('/admin/tournaments')
    return { success: true }
  } catch {
    return { error: 'Failed to update tournament.' }
  }
}

export async function deleteTournamentAction(id: string): Promise<ActionResult> {
  try {
    await deleteTournament(id)
    revalidatePath('/admin/tournaments')
    return { success: true }
  } catch {
    return { error: 'Failed to delete tournament.' }
  }
}

// ── Position Points ──────────────────────────────────────────────────────────

export async function getPositionPointsAction(
  tournamentId: string
): Promise<{ data: TournamentPositionPoints[] } | { error: string }> {
  try {
    const data = await listPositionPoints(tournamentId)
    return { data }
  } catch {
    return { error: 'Failed to load position points.' }
  }
}

export async function savePositionPointsAction(
  tournamentId: string,
  rows: { finish_position: number; points: number }[]
): Promise<ActionResult> {
  try {
    await upsertPositionPoints(tournamentId, rows)
    revalidatePath('/admin/tournaments')
    return { success: true }
  } catch {
    return { error: 'Failed to save position points.' }
  }
}

// ── Tournament Entries ───────────────────────────────────────────────────────

export async function getTournamentEntriesAction(
  tournamentId: string
): Promise<{ data: TournamentEntry[] } | { error: string }> {
  try {
    const data = await listTournamentEntries(tournamentId)
    return { data }
  } catch {
    return { error: 'Failed to load entries.' }
  }
}

export type EntryActionInput = {
  player_id: string
  team_id: string | null
  gross_score: number | null
  handicap_used: number | null
  net_score: number | null
  finish_position: number | null
  points_awarded: number | null
}

export async function createTournamentEntryAction(
  tournamentId: string,
  input: EntryActionInput
): Promise<ActionResult> {
  try {
    await createTournamentEntry(tournamentId, input)
    revalidatePath('/admin/tournaments')
    return { success: true }
  } catch (e: unknown) {
    if (e && typeof e === 'object' && 'code' in e && e.code === '23505') {
      return { error: 'This player already has an entry in this tournament.' }
    }
    return { error: 'Failed to create entry.' }
  }
}

export async function updateTournamentEntryAction(
  id: string,
  input: Omit<EntryActionInput, 'player_id'>
): Promise<ActionResult> {
  try {
    await updateTournamentEntry(id, input)
    revalidatePath('/admin/tournaments')
    return { success: true }
  } catch {
    return { error: 'Failed to update entry.' }
  }
}

export async function deleteTournamentEntryAction(id: string): Promise<ActionResult> {
  try {
    await deleteTournamentEntry(id)
    revalidatePath('/admin/tournaments')
    return { success: true }
  } catch {
    return { error: 'Failed to delete entry.' }
  }
}

// ── Bulk save (Kickoff table) ────────────────────────────────────────────────

export type BulkEntryRow = {
  player_id: string
  team_id: string | null
  gross_score: number | null
  handicap_used: number | null
  net_score: number | null
  finish_position: number | null
  points_awarded: number | null
}

export async function saveAllTournamentEntriesAction(
  tournamentId: string,
  rows: BulkEntryRow[]
): Promise<ActionResult> {
  try {
    await replaceAllTournamentEntries(tournamentId, rows)
    const allHaveScores = rows.length > 0 && rows.every((r) => r.gross_score !== null)
    await setTournamentStatus(tournamentId, allHaveScores ? 'complete' : 'setup')
    revalidatePath('/admin/tournaments/kickoff')
    revalidatePath('/admin/tournaments')
    revalidatePath('/tournaments')
    return { success: true }
  } catch {
    return { error: 'Failed to save entries.' }
  }
}

// ── Kickoff setup save ───────────────────────────────────────────────────────

type KickoffSetupMeta = {
  tournament_date: string
  course: string | null
  poster_url: string | null
}

type KickoffSetupPlayer = {
  player_id: string
  team_id: string | null
  handicap_used: number
}

type KickoffSetupPoints = {
  finish_position: number
  points: number
}

export async function saveKickoffSetupAction(
  tournamentId: string,
  meta: KickoffSetupMeta,
  players: KickoffSetupPlayer[],
  positionPoints: KickoffSetupPoints[]
): Promise<ActionResult> {
  try {
    await updateTournament(tournamentId, {
      tournament_date: meta.tournament_date,
      course: meta.course,
      poster_url: meta.poster_url,
    })

    await replaceAllTournamentEntries(
      tournamentId,
      players.map((p) => ({
        player_id: p.player_id,
        team_id: p.team_id,
        gross_score: null,
        handicap_used: p.handicap_used,
        net_score: null,
        finish_position: null,
        points_awarded: null,
      })),
    )

    await upsertPositionPoints(tournamentId, positionPoints)
    await setTournamentStatus(tournamentId, 'setup')

    revalidatePath('/admin/tournaments/kickoff')
    revalidatePath('/admin/tournaments')
    revalidatePath('/tournaments')
    return { success: true }
  } catch {
    return { error: 'Failed to save tournament setup.' }
  }
}

// ── Convenience: load full tournament data ───────────────────────────────────

export async function getTournamentDataAction(tournamentId: string): Promise<{
  positionPoints: TournamentPositionPoints[]
  entries: TournamentEntry[]
} | { error: string }> {
  try {
    const [positionPoints, entries] = await Promise.all([
      listPositionPoints(tournamentId),
      listTournamentEntries(tournamentId),
    ])
    return { positionPoints, entries }
  } catch {
    return { error: 'Failed to load tournament data.' }
  }
}
