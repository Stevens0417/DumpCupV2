'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { Match, MatchPlayer, MatchType, MatchTypeAllocation, Team, Player, Roster, Season } from '@/types/database'
import { deleteMatchAction, getMatchPlayersAction } from './actions'
import MatchForm from './MatchForm'

type Props = {
  seasons: Season[]
  selectedSeasonId: string | null
  matchTypes: MatchType[]
  allAllocations: MatchTypeAllocation[]
  teams: Team[]
  players: Player[]
  rosters: Roster[]
  matches: Match[]
}

export default function MatchesClient({
  seasons,
  selectedSeasonId,
  matchTypes,
  allAllocations,
  teams,
  players,
  rosters,
  matches,
}: Props) {
  const router = useRouter()
  const [showForm, setShowForm] = useState(false)
  const [editMatch, setEditMatch] = useState<Match | undefined>()
  const [editMatchPlayers, setEditMatchPlayers] = useState<MatchPlayer[] | undefined>()
  const [loadingEditId, setLoadingEditId] = useState<string | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [actionError, setActionError] = useState<string | null>(null)

  function teamName(id: string) {
    return teams.find((t) => t.id === id)?.name ?? id.slice(0, 8)
  }
  function matchTypeName(id: string) {
    return matchTypes.find((mt) => mt.id === id)?.name ?? '—'
  }

  function handleSeasonChange(seasonId: string) {
    router.push(seasonId ? `/admin/matches?season=${seasonId}` : '/admin/matches')
  }

  function handleAddClick() {
    setEditMatch(undefined)
    setEditMatchPlayers(undefined)
    setShowForm(true)
    setActionError(null)
  }

  async function handleEditClick(match: Match) {
    setLoadingEditId(match.id)
    const result = await getMatchPlayersAction(match.id)
    setLoadingEditId(null)
    if ('error' in result) {
      setActionError(result.error)
      return
    }
    setEditMatch(match)
    setEditMatchPlayers(result.data)
    setShowForm(true)
    setActionError(null)
  }

  function handleFormSuccess() {
    setShowForm(false)
    setEditMatch(undefined)
    setEditMatchPlayers(undefined)
    router.push(`/admin/matches?season=${selectedSeasonId ?? ''}`)
  }

  function handleFormCancel() {
    setShowForm(false)
    setEditMatch(undefined)
    setEditMatchPlayers(undefined)
  }

  function handleDeleteConfirm(id: string) {
    setActionError(null)
    startTransition(async () => {
      const result = await deleteMatchAction(id)
      if ('error' in result) {
        setActionError(result.error)
      } else {
        setDeleteConfirmId(null)
        router.push(`/admin/matches?season=${selectedSeasonId ?? ''}`)
      }
    })
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Matches</h1>
        {selectedSeasonId && !showForm && (
          <button
            onClick={handleAddClick}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded"
          >
            + Add Match
          </button>
        )}
      </div>

      {/* Season selector */}
      <div>
        <label className="block text-xs text-gray-400 mb-1">Season</label>
        <select
          className="bg-gray-800 border border-white/20 rounded px-3 py-2 text-sm text-white w-full max-w-xs"
          value={selectedSeasonId ?? ''}
          onChange={(e) => handleSeasonChange(e.target.value)}
        >
          <option value="">— select season —</option>
          {seasons.map((s) => (
            <option key={s.id} value={s.id}>
              {s.year}
            </option>
          ))}
        </select>
      </div>

      {actionError && <p className="text-red-400 text-sm">{actionError}</p>}

      {/* Add/Edit form */}
      {showForm && selectedSeasonId && (
        <div className="bg-gray-800 border border-white/10 rounded-lg p-4">
          <h2 className="text-sm font-semibold mb-4">{editMatch ? 'Edit Match' : 'New Match'}</h2>
          <MatchForm
            seasonId={selectedSeasonId}
            matchTypes={matchTypes}
            teams={teams}
            players={players}
            rosters={rosters}
            allAllocations={allAllocations}
            editMatch={editMatch}
            editMatchPlayers={editMatchPlayers}
            onSuccess={handleFormSuccess}
            onCancel={handleFormCancel}
          />
        </div>
      )}

      {/* Match list */}
      {!selectedSeasonId && (
        <p className="text-gray-400 text-sm">Select a season to view matches.</p>
      )}

      {selectedSeasonId && !showForm && matches.length === 0 && (
        <p className="text-gray-400 text-sm">No matches yet for this season.</p>
      )}

      {selectedSeasonId && matches.length > 0 && (
        <div className="space-y-2">
          {matches.map((m) => {
            const isDeleting = deleteConfirmId === m.id
            const isLoadingEdit = loadingEditId === m.id
            return (
              <div key={m.id} className="bg-gray-800 border border-white/10 rounded-lg p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">
                      {m.match_date} — {matchTypeName(m.match_type_id)}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {teamName(m.team_a_id)} {m.team_a_points} vs {m.team_b_points} {teamName(m.team_b_id)}
                    </p>
                    {(m.team_a_gross != null || m.team_a_net != null) && (
                      <p className="text-xs text-gray-500 mt-0.5">
                        Gross: {m.team_a_gross ?? '—'} / {m.team_b_gross ?? '—'} &nbsp;
                        Net: {m.team_a_net ?? '—'} / {m.team_b_net ?? '—'}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2 shrink-0">
                    {!isDeleting && (
                      <>
                        <button
                          onClick={() => handleEditClick(m)}
                          disabled={isLoadingEdit || isPending}
                          className="text-xs text-blue-400 hover:text-blue-300 disabled:opacity-50"
                        >
                          {isLoadingEdit ? 'Loading…' : 'Edit'}
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(m.id)}
                          disabled={isPending}
                          className="text-xs text-red-400 hover:text-red-300 disabled:opacity-50"
                        >
                          Delete
                        </button>
                      </>
                    )}
                    {isDeleting && (
                      <div className="flex gap-2 items-center">
                        <span className="text-xs text-yellow-400">Delete?</span>
                        <button
                          onClick={() => handleDeleteConfirm(m.id)}
                          disabled={isPending}
                          className="text-xs text-red-400 hover:text-red-300 disabled:opacity-50"
                        >
                          Yes
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(null)}
                          className="text-xs text-gray-400 hover:text-white"
                        >
                          No
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
