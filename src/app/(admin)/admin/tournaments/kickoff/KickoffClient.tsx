'use client'

import { useState, useMemo, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { Tournament, TournamentEntry, Season, Team } from '@/types/database'
import type { PlayerWithTeam } from '@/lib/db/tournamentUtils'
import { saveAllTournamentEntriesAction } from '../actions'

type Props = {
  seasons: Season[]
  selectedSeasonId: string
  tournament: Tournament
  playersWithTeams: PlayerWithTeam[]
  teams: Team[]
  initialEntries: TournamentEntry[]
}

type EditState = { gross: string; points: string }

type DisplayRow = {
  player_id: string
  player_name: string
  team_id: string | null
  handicap: number
  gross: string
  points: string
  net: number | null
  finish_position: number | null
}

export default function KickoffClient({
  seasons,
  selectedSeasonId,
  tournament,
  playersWithTeams,
  teams,
  initialEntries,
}: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [savedAt, setSavedAt] = useState<Date | null>(null)
  const [dirty, setDirty] = useState(false)

  // editMap: player_id → { gross, points }
  const [editMap, setEditMap] = useState<Map<string, EditState>>(() => {
    const map = new Map<string, EditState>()
    for (const entry of initialEntries) {
      map.set(entry.player_id, {
        gross: entry.gross_score != null ? String(entry.gross_score) : '',
        points: entry.points_awarded != null ? String(entry.points_awarded) : '',
      })
    }
    return map
  })

  function teamName(teamId: string | null) {
    if (!teamId) return '—'
    return teams.find((t) => t.id === teamId)?.name ?? '—'
  }

  // Derive sorted display rows with computed net + finish position
  const displayRows = useMemo((): DisplayRow[] => {
    const rows: DisplayRow[] = playersWithTeams.map((p) => {
      const edit = editMap.get(p.id) ?? { gross: '', points: '' }
      const grossNum = edit.gross !== '' ? parseFloat(edit.gross) : null
      const net = grossNum !== null && !isNaN(grossNum) ? Math.round(grossNum - p.handicap) : null
      return {
        player_id: p.id,
        player_name: p.full_name,
        team_id: p.team_id,
        handicap: p.handicap,
        gross: edit.gross,
        points: edit.points,
        net,
        finish_position: null,
      }
    })

    // Sort: net ASC (nulls last), then name ASC as tie-break
    rows.sort((a, b) => {
      if (a.net === null && b.net === null) return a.player_name.localeCompare(b.player_name)
      if (a.net === null) return 1
      if (b.net === null) return -1
      if (a.net !== b.net) return a.net - b.net
      return a.player_name.localeCompare(b.player_name)
    })

    // Assign finish positions (ties share the same position, next pos skips)
    let pos = 1
    for (let i = 0; i < rows.length; i++) {
      if (rows[i].net === null) {
        rows[i].finish_position = null
      } else if (i > 0 && rows[i].net === rows[i - 1].net) {
        rows[i].finish_position = rows[i - 1].finish_position
        pos++ // still advance so next non-tied row gets the correct position
      } else {
        rows[i].finish_position = pos
        pos++
      }
    }

    return rows
  }, [playersWithTeams, editMap])

  function setField(playerId: string, field: keyof EditState, value: string) {
    setEditMap((prev) => {
      const next = new Map(prev)
      next.set(playerId, { ...(next.get(playerId) ?? { gross: '', points: '' }), [field]: value })
      return next
    })
    setDirty(true)
  }

  function handleSeasonChange(seasonId: string) {
    router.push(`/admin/tournaments?season=${seasonId}`)
  }

  function handleSave() {
    const entriesToSave = displayRows
      .filter((r) => r.gross !== '' || r.points !== '')
      .map((r) => ({
        player_id: r.player_id,
        team_id: r.team_id,
        gross_score: r.gross !== '' ? Math.round(parseFloat(r.gross)) : null,
        handicap_used: r.handicap,
        net_score: r.net,
        finish_position: r.finish_position,
        points_awarded: r.points !== '' ? parseFloat(r.points) : null,
      }))

    startTransition(async () => {
      const result = await saveAllTournamentEntriesAction(tournament.id, entriesToSave)
      if ('error' in result) {
        setError(result.error)
      } else {
        setError(null)
        setDirty(false)
        setSavedAt(new Date())
        router.refresh()
      }
    })
  }

  const hasScores = displayRows.some((r) => r.gross !== '')

  return (
    <div className="space-y-4">
      {/* Header row */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Link
            href={`/admin/tournaments?season=${selectedSeasonId}`}
            className="text-xs text-gray-400 hover:text-white transition-colors"
          >
            ← Tournaments
          </Link>
          <span className="text-gray-700">/</span>
          <h1 className="text-xl font-bold">Kickoff Tournament</h1>
          {dirty && (
            <span className="text-xs text-yellow-400 font-medium">Unsaved changes</span>
          )}
        </div>
        <button
          onClick={handleSave}
          disabled={isPending || !dirty}
          className="bg-green-700 hover:bg-green-600 disabled:opacity-40 text-white text-sm font-medium px-5 py-2 rounded transition-colors"
        >
          {isPending ? 'Saving…' : 'Save All'}
        </button>
      </div>

      {/* Season + tournament info bar */}
      <div className="flex items-end gap-6 flex-wrap">
        <div>
          <label className="block text-xs text-gray-400 mb-1">Season</label>
          <select
            value={selectedSeasonId}
            onChange={(e) => handleSeasonChange(e.target.value)}
            className="bg-gray-800 border border-white/20 rounded px-3 py-2 text-sm text-white"
          >
            {seasons.map((s) => (
              <option key={s.id} value={s.id}>
                {s.year}
              </option>
            ))}
          </select>
        </div>
        <div className="text-xs text-gray-500 pb-2">
          {tournament.tournament_date && (
            <span className="mr-3">{tournament.tournament_date}</span>
          )}
          {tournament.course && <span>{tournament.course}</span>}
          {!tournament.tournament_date && !tournament.course && (
            <span className="text-gray-600 italic">No date or course set</span>
          )}
        </div>
      </div>

      {/* Status messages */}
      {error && <p className="text-red-400 text-sm">{error}</p>}
      {savedAt && !dirty && (
        <p className="text-green-400 text-xs">
          Saved at {savedAt.toLocaleTimeString()}
        </p>
      )}

      {/* Entries table */}
      <div className="overflow-x-auto rounded-lg border border-white/10">
        <table className="w-full text-sm min-w-[640px]">
          <thead>
            <tr className="bg-gray-800 border-b border-white/10 text-left">
              <th className="px-3 py-2.5 text-xs font-medium text-gray-400 w-10 text-center">#</th>
              <th className="px-3 py-2.5 text-xs font-medium text-gray-400">Player</th>
              <th className="px-3 py-2.5 text-xs font-medium text-gray-400">Team</th>
              <th className="px-3 py-2.5 text-xs font-medium text-gray-400 text-center w-14">HCP</th>
              <th className="px-3 py-2.5 text-xs font-medium text-gray-400 text-center w-24">Gross</th>
              <th className="px-3 py-2.5 text-xs font-medium text-gray-400 text-center w-16">Net</th>
              <th className="px-3 py-2.5 text-xs font-medium text-gray-400 text-center w-24">Points</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {displayRows.map((row) => (
              <tr
                key={row.player_id}
                className="bg-gray-900 hover:bg-gray-800/60 transition-colors"
              >
                {/* Finish position */}
                <td className="px-3 py-2 text-center text-xs text-gray-500 tabular-nums">
                  {row.finish_position ?? '—'}
                </td>

                {/* Player name */}
                <td className="px-3 py-2 font-medium text-white whitespace-nowrap">
                  {row.player_name}
                </td>

                {/* Team */}
                <td className="px-3 py-2 text-xs text-gray-400 whitespace-nowrap">
                  {teamName(row.team_id)}
                </td>

                {/* Handicap (read-only) */}
                <td className="px-3 py-2 text-center text-gray-400 tabular-nums">
                  {row.handicap}
                </td>

                {/* Gross score input */}
                <td className="px-2 py-1.5">
                  <input
                    type="number"
                    value={row.gross}
                    min={18}
                    max={200}
                    onChange={(e) => setField(row.player_id, 'gross', e.target.value)}
                    className="w-full bg-gray-700 border border-white/10 rounded px-2 py-1 text-center text-sm text-white focus:outline-none focus:border-blue-500/60 tabular-nums"
                    placeholder="—"
                  />
                </td>

                {/* Net score (computed, read-only) */}
                <td className="px-3 py-2 text-center tabular-nums">
                  {row.net !== null ? (
                    <span className={row.net < 0 ? 'text-green-400' : 'text-gray-300'}>
                      {row.net}
                    </span>
                  ) : (
                    <span className="text-gray-600">—</span>
                  )}
                </td>

                {/* Points input (can be negative) */}
                <td className="px-2 py-1.5">
                  <input
                    type="number"
                    value={row.points}
                    step="any"
                    onChange={(e) => setField(row.player_id, 'points', e.target.value)}
                    className="w-full bg-gray-700 border border-white/10 rounded px-2 py-1 text-center text-sm text-white focus:outline-none focus:border-blue-500/60 tabular-nums"
                    placeholder="—"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {displayRows.length === 0 && (
          <p className="text-center text-gray-400 text-sm py-10">
            No active players found for this season.
          </p>
        )}
      </div>

      {/* Bottom save button (visible when table is long) */}
      {displayRows.length > 6 && (
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={isPending || !dirty}
            className="bg-green-700 hover:bg-green-600 disabled:opacity-40 text-white text-sm font-medium px-5 py-2 rounded transition-colors"
          >
            {isPending ? 'Saving…' : 'Save All'}
          </button>
        </div>
      )}

      {/* Hint text */}
      {hasScores && (
        <p className="text-xs text-gray-600">
          Rows sorted by net score ascending. Finish positions assigned automatically.
        </p>
      )}
    </div>
  )
}
