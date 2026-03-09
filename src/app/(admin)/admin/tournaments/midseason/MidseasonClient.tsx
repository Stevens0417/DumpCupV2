'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type {
  Match,
  MatchPlayer,
  MatchType,
  MatchTypeAllocation,
  Season,
  Team,
  Player,
  Roster,
  Tournament,
} from '@/types/database'
import {
  deleteMidseasonMatchAction,
  getMidseasonMatchPlayersAction,
} from './actions'
import MidseasonMatchForm from './MidseasonMatchForm'

type Props = {
  seasons: Season[]
  selectedSeasonId: string
  tournament: Tournament
  matchTypes: MatchType[]
  allAllocations: MatchTypeAllocation[]
  teams: Team[]
  players: Player[]
  rosters: Roster[]
  matches: Match[]
}

type FormMode =
  | { kind: 'closed' }
  | { kind: 'add' }
  | { kind: 'edit'; match: Match; matchPlayers: MatchPlayer[] }

export default function MidseasonClient({
  seasons,
  selectedSeasonId,
  tournament,
  matchTypes,
  allAllocations,
  teams,
  players,
  rosters,
  matches,
}: Props) {
  const router = useRouter()
  const [formMode, setFormMode] = useState<FormMode>({ kind: 'closed' })
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [isDeleting, startDeleteTransition] = useTransition()
  const [editLoading, setEditLoading] = useState(false)

  function teamName(id: string | null) {
    if (!id) return '—'
    return teams.find((t) => t.id === id)?.name ?? '—'
  }

  function matchTypeName(id: string | null) {
    if (!id) return '—'
    return matchTypes.find((mt) => mt.id === id)?.name ?? '—'
  }

  function handleSeasonChange(seasonId: string) {
    router.push(`/admin/tournaments?season=${seasonId}`)
  }

  function handleSuccess() {
    setFormMode({ kind: 'closed' })
    router.refresh()
  }

  function handleCancel() {
    setFormMode({ kind: 'closed' })
  }

  async function handleEditClick(match: Match) {
    setEditLoading(true)
    const result = await getMidseasonMatchPlayersAction(match.id)
    setEditLoading(false)
    if ('error' in result) {
      setDeleteError(result.error)
      return
    }
    setFormMode({ kind: 'edit', match, matchPlayers: result.data })
  }

  function handleDeleteConfirm(matchId: string) {
    setDeleteId(matchId)
    setDeleteError(null)
  }

  function handleDeleteCancel() {
    setDeleteId(null)
    setDeleteError(null)
  }

  function handleDeleteExecute() {
    if (!deleteId) return
    startDeleteTransition(async () => {
      const result = await deleteMidseasonMatchAction(deleteId)
      if ('error' in result) {
        setDeleteError(result.error)
      } else {
        setDeleteId(null)
        setDeleteError(null)
        router.refresh()
      }
    })
  }

  const showForm = formMode.kind !== 'closed'

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Link
            href={`/admin/tournaments?season=${selectedSeasonId}`}
            className="text-xs text-gray-400 hover:text-white transition-colors"
          >
            ← Tournaments
          </Link>
          <span className="text-gray-700">/</span>
          <h1 className="text-xl font-bold">Midseason Tournament</h1>
        </div>
        {!showForm && (
          <button
            onClick={() => setFormMode({ kind: 'add' })}
            disabled={editLoading}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded transition-colors"
          >
            + Add Match
          </button>
        )}
      </div>

      {/* Season + tournament info */}
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

      {/* Delete error */}
      {deleteError && <p className="text-red-400 text-sm">{deleteError}</p>}

      {/* Delete confirm dialog */}
      {deleteId && (
        <div className="rounded-lg border border-red-500/40 bg-red-950/30 p-4 flex items-center gap-4 flex-wrap">
          <p className="text-sm text-red-300 flex-1">Delete this match? This cannot be undone.</p>
          <div className="flex gap-2">
            <button
              onClick={handleDeleteExecute}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-sm px-4 py-1.5 rounded"
            >
              {isDeleting ? 'Deleting…' : 'Delete'}
            </button>
            <button
              onClick={handleDeleteCancel}
              disabled={isDeleting}
              className="border border-white/20 text-gray-400 hover:text-white text-sm px-4 py-1.5 rounded"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Form */}
      {showForm && (
        <div className="rounded-lg border border-white/10 bg-gray-800/40 p-4">
          <h2 className="text-sm font-semibold text-white mb-4">
            {formMode.kind === 'edit' ? 'Edit Match' : 'New Match'}
          </h2>
          <MidseasonMatchForm
            tournamentId={tournament.id}
            tournamentDate={tournament.tournament_date}
            seasonId={selectedSeasonId}
            matchTypes={matchTypes}
            allAllocations={allAllocations}
            teams={teams}
            players={players}
            rosters={rosters}
            editMatch={formMode.kind === 'edit' ? formMode.match : undefined}
            editMatchPlayers={formMode.kind === 'edit' ? formMode.matchPlayers : undefined}
            onSuccess={handleSuccess}
            onCancel={handleCancel}
          />
        </div>
      )}

      {/* Matches list */}
      <div className="overflow-x-auto rounded-lg border border-white/10">
        <table className="w-full text-sm min-w-[640px]">
          <thead>
            <tr className="bg-gray-800 border-b border-white/10 text-left">
              <th className="px-3 py-2.5 text-xs font-medium text-gray-400">Date</th>
              <th className="px-3 py-2.5 text-xs font-medium text-gray-400">Type</th>
              <th className="px-3 py-2.5 text-xs font-medium text-gray-400">Team A</th>
              <th className="px-3 py-2.5 text-xs font-medium text-gray-400 text-center w-20">
                A Net
              </th>
              <th className="px-3 py-2.5 text-xs font-medium text-gray-400 text-center w-20">
                B Net
              </th>
              <th className="px-3 py-2.5 text-xs font-medium text-gray-400">Team B</th>
              <th className="px-3 py-2.5 text-xs font-medium text-gray-400 text-center w-20">
                Pts
              </th>
              <th className="px-3 py-2.5 text-xs font-medium text-gray-400 w-24" />
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {matches.map((m) => {
              const aWon =
                m.team_a_net !== null &&
                m.team_b_net !== null &&
                m.team_a_net < m.team_b_net
              const bWon =
                m.team_a_net !== null &&
                m.team_b_net !== null &&
                m.team_b_net < m.team_a_net
              const isTie =
                m.team_a_net !== null &&
                m.team_b_net !== null &&
                m.team_a_net === m.team_b_net

              return (
                <tr
                  key={m.id}
                  className="bg-gray-900 hover:bg-gray-800/60 transition-colors"
                >
                  <td className="px-3 py-2 text-gray-400 whitespace-nowrap text-xs">
                    {m.match_date}
                  </td>
                  <td className="px-3 py-2 text-gray-300 whitespace-nowrap text-xs">
                    {matchTypeName(m.match_type_id)}
                  </td>
                  <td className="px-3 py-2 font-medium text-white whitespace-nowrap">
                    <span className={aWon ? 'text-green-400' : ''}>
                      {teamName(m.team_a_id)}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-center tabular-nums text-gray-300">
                    {m.team_a_net ?? '—'}
                  </td>
                  <td className="px-3 py-2 text-center tabular-nums text-gray-300">
                    {m.team_b_net ?? '—'}
                  </td>
                  <td className="px-3 py-2 font-medium text-white whitespace-nowrap">
                    <span className={bWon ? 'text-green-400' : ''}>
                      {teamName(m.team_b_id)}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-center text-xs tabular-nums">
                    {m.match_points != null ? (
                      <span className="text-gray-300">{m.match_points}</span>
                    ) : isTie ? (
                      <span className="text-yellow-400 text-xs">Tie</span>
                    ) : (
                      <span className="text-gray-600">—</span>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => handleEditClick(m)}
                        disabled={editLoading || showForm}
                        className="text-xs text-blue-400 hover:text-blue-300 disabled:opacity-40"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteConfirm(m.id)}
                        disabled={isDeleting || showForm}
                        className="text-xs text-red-400 hover:text-red-300 disabled:opacity-40"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>

        {matches.length === 0 && (
          <p className="text-center text-gray-500 text-sm py-10">
            No matches yet. Click &ldquo;+ Add Match&rdquo; to get started.
          </p>
        )}
      </div>
    </div>
  )
}
