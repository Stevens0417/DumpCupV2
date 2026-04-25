'use client'

import { useState, useTransition, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { Season, Team, Player, Roster } from '@/types/database'
import { createRosterAction, updateRosterAction, deleteRosterAction } from './actions'

type Props = {
  seasons: Season[]
  teams: Team[]
  players: Player[]
  rosters: Roster[]
  selectedSeasonId: string | null
}

type FormState = { error?: string; success?: boolean }

function formatDate(iso: string | null) {
  if (!iso) return 'present'
  return iso
}

export default function DraftClient({ seasons, teams, players, rosters, selectedSeasonId }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  // Add form state
  const [addFormKey, setAddFormKey] = useState(0)
  const [addState, setAddState] = useState<FormState>({})
  const [selectedPlayerId, setSelectedPlayerId] = useState('')
  const [addIsCelebrity, setAddIsCelebrity] = useState(false)

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editState, setEditState] = useState<FormState>({})
  const [editIsCelebrity, setEditIsCelebrity] = useState(false)

  // Delete state
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleteErrors, setDeleteErrors] = useState<Record<string, string>>({})

  const selectedSeason = seasons.find((s) => s.id === selectedSeasonId)
  const defaultEffectiveFrom = selectedSeason ? `${selectedSeason.year}-01-01` : ''
  const now = new Date()
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`

  const rosteredPlayerIds = new Set(
    rosters.filter((r) => r.effective_to === null).map((r) => r.player_id)
  )
  const availablePlayers = players
    .filter((p) => !rosteredPlayerIds.has(p.id))
    .sort((a, b) => a.handicap - b.handicap || a.full_name.localeCompare(b.full_name))

  useEffect(() => {
    if (addState.success) {
      const t = setTimeout(() => setAddState({}), 2000)
      return () => clearTimeout(t)
    }
  }, [addState.success])

  useEffect(() => {
    if (editingId) {
      const roster = rosters.find((r) => r.id === editingId)
      setEditIsCelebrity(roster?.is_celebrity ?? false)
    }
  }, [editingId, rosters])

  function handleSeasonChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const id = e.target.value
    router.push(id ? `/admin/draft?season=${id}` : '/admin/draft')
  }

  function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!selectedSeasonId) return
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await createRosterAction(selectedSeasonId, formData)
      if ('error' in result) {
        setAddState({ error: result.error })
      } else {
        setAddState({ success: true })
        setAddFormKey((k) => k + 1)
        setSelectedPlayerId('')
        setAddIsCelebrity(false)
        router.refresh()
      }
    })
  }

  function handleUpdate(roster: Roster, e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await updateRosterAction(
        roster.id,
        roster.season_id,
        roster.player_id,
        formData
      )
      if ('error' in result) {
        setEditState({ error: result.error })
      } else {
        setEditingId(null)
        setEditState({})
        router.refresh()
      }
    })
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      const result = await deleteRosterAction(id)
      if ('error' in result) {
        setDeleteErrors((prev) => ({ ...prev, [id]: result.error }))
        setDeletingId(null)
      } else {
        setDeletingId(null)
        router.refresh()
      }
    })
  }

  function startEditing(id: string) {
    setEditingId(id)
    setEditState({})
  }

  const playerMap = Object.fromEntries(players.map((p) => [p.id, p]))
  const defaultHandicap = playerMap[selectedPlayerId]?.handicap ?? 0

  // Group rosters by team (sorted by player name within each team)
  const rostersByTeam = teams.map((team) => ({
    team,
    rows: rosters
      .filter((r) => r.team_id === team.id)
      .sort((a, b) =>
        (playerMap[a.player_id]?.full_name ?? '').localeCompare(
          playerMap[b.player_id]?.full_name ?? ''
        )
      ),
  }))

  const inputClass =
    'bg-gray-800 border border-white/10 rounded px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-white/30'
  const inputSmClass =
    'bg-gray-800 border border-white/20 rounded px-2 py-1.5 text-sm text-white focus:outline-none focus:border-white/40'

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Season Selector */}
      <section>
        <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
          Season
        </label>
        <select
          value={selectedSeasonId ?? ''}
          onChange={handleSeasonChange}
          className={inputClass}
        >
          <option value="">— Select a season —</option>
          {seasons.map((s) => (
            <option key={s.id} value={s.id}>
              {s.year}
            </option>
          ))}
        </select>
      </section>

      {!selectedSeasonId ? (
        <p className="text-gray-500 text-sm">Select a season to manage the draft.</p>
      ) : (
        <>
          {/* Two-column: form left, available players right */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">

          {/* Add to Roster Form */}
          <section>
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Add to Roster
            </h2>
            {teams.length === 0 ? (
              <p className="text-gray-500 text-sm">
                No teams for this season. Add teams first.
              </p>
            ) : players.length === 0 ? (
              <p className="text-gray-500 text-sm">
                No active players found. Add players first.
              </p>
            ) : (
              <form key={addFormKey} onSubmit={handleCreate} className="space-y-3">
                {/* Row 1: Player + Team */}
                <div className="grid grid-cols-2 gap-2">
                  <select
                    name="player_id"
                    required
                    value={selectedPlayerId}
                    onChange={(e) => setSelectedPlayerId(e.target.value)}
                    className={inputClass}
                  >
                    <option value="">— Player —</option>
                    {players.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.full_name}
                      </option>
                    ))}
                  </select>
                  <select name="team_id" required className={inputClass}>
                    <option value="">— Team —</option>
                    {teams.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Row 2: Handicap + Drafted At */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Handicap at draft</label>
                    <input
                      key={`hcp-${selectedPlayerId}`}
                      name="handicap_at_draft"
                      type="number"
                      step="0.1"
                      defaultValue={defaultHandicap}
                      min={-10}
                      max={54}
                      className={inputClass + ' w-full'}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Drafted at (optional)</label>
                    <input
                      name="drafted_at"
                      type="date"
                      defaultValue={today}
                      className={inputClass + ' w-full'}
                    />
                  </div>
                </div>

                {/* Row 3: Effective From + Effective To */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Effective from *</label>
                    <input
                      name="effective_from"
                      type="date"
                      required
                      defaultValue={defaultEffectiveFrom}
                      className={inputClass + ' w-full'}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">
                      Effective to (blank = present)
                    </label>
                    <input
                      name="effective_to"
                      type="date"
                      className={inputClass + ' w-full'}
                    />
                  </div>
                </div>

                {/* Celebrity + Submit */}
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={addIsCelebrity}
                      onChange={(e) => setAddIsCelebrity(e.target.checked)}
                      className="w-4 h-4 accent-white"
                    />
                    Celebrity player
                  </label>
                  <input type="hidden" name="is_celebrity" value={addIsCelebrity ? 'true' : 'false'} />
                  <button
                    type="submit"
                    disabled={isPending}
                    className="bg-white text-gray-950 text-sm font-semibold px-4 py-2 rounded hover:bg-gray-200 disabled:opacity-50 transition-colors"
                  >
                    Add to Roster
                  </button>
                </div>

                {addState.error && <p className="text-red-400 text-xs">{addState.error}</p>}
                {addState.success && <p className="text-green-400 text-xs">Player added to roster.</p>}
              </form>
            )}
          </section>

          {/* Available Players */}
          <section>
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Available Players
            </h2>
            {availablePlayers.length === 0 ? (
              <p className="text-gray-500 text-sm">All players have been drafted for this season.</p>
            ) : (
              <ul className="space-y-1.5">
                {availablePlayers.map((p) => (
                  <li
                    key={p.id}
                    className="bg-gray-900 border border-white/10 rounded px-3 py-2"
                  >
                    <span className="text-sm font-medium text-white">{p.full_name}</span>
                    <span className="text-xs text-gray-500 ml-2">HCP {p.handicap}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          </div>{/* end two-column grid */}

          {/* Rosters grouped by team */}
          <section className="space-y-6">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Rosters
            </h2>
            {rostersByTeam.map(({ team, rows }) => (
              <div key={team.id}>
                <h3 className="text-sm font-semibold text-white mb-2">
                  {team.name}
                  <span className="ml-2 text-xs text-gray-500 font-normal">
                    ({rows.length} {rows.length === 1 ? 'player' : 'players'})
                  </span>
                </h3>
                {rows.length === 0 ? (
                  <p className="text-gray-600 text-xs pl-1">No players assigned yet.</p>
                ) : (
                  <ul className="space-y-1.5">
                    {rows.map((roster) => {
                      const player = playerMap[roster.player_id]
                      return (
                        <li
                          key={roster.id}
                          className="bg-gray-900 border border-white/10 rounded p-3"
                        >
                          {editingId === roster.id ? (
                            <form
                              onSubmit={(e) => handleUpdate(roster, e)}
                              className="space-y-2"
                            >
                              <div className="text-xs text-gray-400 mb-1">
                                Editing:{' '}
                                <span className="text-white font-medium">
                                  {player?.full_name ?? roster.player_id}
                                </span>
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                {/* Team (can change) */}
                                <select name="team_id" defaultValue={roster.team_id} className={inputSmClass}>
                                  {teams.map((t) => (
                                    <option key={t.id} value={t.id}>
                                      {t.name}
                                    </option>
                                  ))}
                                </select>
                                {/* Handicap */}
                                <input
                                  name="handicap_at_draft"
                                  type="number"
                                  step="0.1"
                                  defaultValue={roster.handicap_at_draft ?? ''}
                                  min={-10}
                                  max={54}
                                  placeholder="HCP"
                                  className={inputSmClass}
                                />
                                {/* Drafted at */}
                                <div>
                                  <label className="block text-xs text-gray-500 mb-0.5">Drafted at</label>
                                  <input
                                    name="drafted_at"
                                    type="date"
                                    defaultValue={roster.drafted_at ?? ''}
                                    className={inputSmClass + ' w-full'}
                                  />
                                </div>
                                {/* Effective from */}
                                <div>
                                  <label className="block text-xs text-gray-500 mb-0.5">Effective from *</label>
                                  <input
                                    name="effective_from"
                                    type="date"
                                    defaultValue={roster.effective_from}
                                    required
                                    className={inputSmClass + ' w-full'}
                                  />
                                </div>
                              </div>
                              {/* Effective to */}
                              <div>
                                <label className="block text-xs text-gray-500 mb-0.5">
                                  Effective to (blank = present)
                                </label>
                                <input
                                  name="effective_to"
                                  type="date"
                                  defaultValue={roster.effective_to ?? ''}
                                  className={inputSmClass + ' w-48'}
                                />
                              </div>
                              {/* Celebrity */}
                              <label className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer select-none">
                                <input
                                  type="checkbox"
                                  checked={editIsCelebrity}
                                  onChange={(e) => setEditIsCelebrity(e.target.checked)}
                                  className="w-3.5 h-3.5 accent-white"
                                />
                                Celebrity
                              </label>
                              <input
                                type="hidden"
                                name="is_celebrity"
                                value={editIsCelebrity ? 'true' : 'false'}
                              />
                              {editState.error && (
                                <p className="text-red-400 text-xs">{editState.error}</p>
                              )}
                              <div className="flex gap-2">
                                <button
                                  type="submit"
                                  disabled={isPending}
                                  className="text-xs bg-white text-gray-950 font-semibold px-3 py-1 rounded hover:bg-gray-200 disabled:opacity-50 transition-colors"
                                >
                                  Save
                                </button>
                                <button
                                  type="button"
                                  onClick={() => { setEditingId(null); setEditState({}) }}
                                  className="text-xs text-gray-400 hover:text-white px-3 py-1 rounded transition-colors"
                                >
                                  Cancel
                                </button>
                              </div>
                            </form>
                          ) : (
                            <div>
                              <div className="flex items-center justify-between gap-3">
                                <div className="min-w-0">
                                  <span className="text-sm font-medium text-white">
                                    {player?.full_name ?? '—'}
                                  </span>
                                  {roster.is_celebrity && (
                                    <span className="ml-2 text-xs bg-yellow-500/20 text-yellow-400 px-1.5 py-0.5 rounded">
                                      Celebrity
                                    </span>
                                  )}
                                  <div className="text-xs text-gray-500 mt-0.5 space-x-2">
                                    {roster.handicap_at_draft != null && (
                                      <span>HCP {roster.handicap_at_draft}</span>
                                    )}
                                    <span>
                                      {formatDate(roster.effective_from)} →{' '}
                                      {formatDate(roster.effective_to)}
                                    </span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-3 flex-shrink-0">
                                  <button
                                    onClick={() => startEditing(roster.id)}
                                    disabled={isPending}
                                    className="text-xs text-gray-400 hover:text-white transition-colors disabled:opacity-50"
                                  >
                                    Edit
                                  </button>
                                  {deletingId === roster.id ? (
                                    <span className="flex items-center gap-1.5">
                                      <span className="text-xs text-red-400">Delete?</span>
                                      <button
                                        onClick={() => handleDelete(roster.id)}
                                        disabled={isPending}
                                        className="text-xs text-red-400 hover:text-red-300 font-semibold disabled:opacity-50"
                                      >
                                        Yes
                                      </button>
                                      <button
                                        onClick={() => setDeletingId(null)}
                                        className="text-xs text-gray-400 hover:text-white"
                                      >
                                        No
                                      </button>
                                    </span>
                                  ) : (
                                    <button
                                      onClick={() => setDeletingId(roster.id)}
                                      disabled={isPending}
                                      className="text-xs text-gray-400 hover:text-red-400 transition-colors disabled:opacity-50"
                                    >
                                      Delete
                                    </button>
                                  )}
                                </div>
                              </div>
                              {deleteErrors[roster.id] && (
                                <p className="text-red-400 text-xs mt-1">
                                  {deleteErrors[roster.id]}
                                </p>
                              )}
                            </div>
                          )}
                        </li>
                      )
                    })}
                  </ul>
                )}
              </div>
            ))}
          </section>
        </>
      )}
    </div>
  )
}
