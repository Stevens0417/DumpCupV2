'use client'

import { useState, useTransition, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { Season, Team } from '@/types/database'
import { createTeamAction, updateTeamAction, deleteTeamAction } from './actions'

type Props = {
  seasons: Season[]
  teams: Team[]
  selectedSeasonId: string | null
}

type FormState = { error?: string; success?: boolean }

function ColorSwatch({ hex }: { hex: string | null }) {
  if (!hex) return null
  return (
    <span
      className="inline-block w-4 h-4 rounded-sm border border-white/20 flex-shrink-0"
      style={{ backgroundColor: hex }}
    />
  )
}

export default function TeamsClient({ seasons, teams, selectedSeasonId }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [addState, setAddState] = useState<FormState>({})
  const [editState, setEditState] = useState<FormState>({})
  const [deleteErrors, setDeleteErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (addState.success) {
      const t = setTimeout(() => setAddState({}), 2000)
      return () => clearTimeout(t)
    }
  }, [addState.success])

  function handleSeasonChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const id = e.target.value
    router.push(id ? `/admin/teams?season=${id}` : '/admin/teams')
  }

  function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!selectedSeasonId) return
    const form = e.currentTarget
    const formData = new FormData(form)
    startTransition(async () => {
      const result = await createTeamAction(selectedSeasonId, formData)
      if ('error' in result) {
        setAddState({ error: result.error })
      } else {
        setAddState({ success: true })
        form.reset()
        router.refresh()
      }
    })
  }

  function handleUpdate(team: Team, e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await updateTeamAction(team.id, formData)
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
      const result = await deleteTeamAction(id)
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

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Season Selector */}
      <section>
        <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
          Season
        </label>
        <select
          value={selectedSeasonId ?? ''}
          onChange={handleSeasonChange}
          className="bg-gray-800 border border-white/10 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-white/30"
        >
          <option value="">— Select a season —</option>
          {seasons.map((s) => (
            <option key={s.id} value={s.id}>
              {s.year}
            </option>
          ))}
        </select>
        {seasons.length === 0 && (
          <p className="text-gray-500 text-xs mt-2">No seasons found. Add one in Supabase first.</p>
        )}
      </section>

      {!selectedSeasonId ? (
        <p className="text-gray-500 text-sm">Select a season to manage teams.</p>
      ) : (
        <>
          {/* Add Team Form */}
          <section>
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Add Team
            </h2>
            <form onSubmit={handleCreate} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <input
                  name="name"
                  type="text"
                  placeholder="Team name *"
                  required
                  className="bg-gray-800 border border-white/10 rounded px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-white/30"
                />
                <input
                  name="captain_name"
                  type="text"
                  placeholder="Captain name"
                  className="bg-gray-800 border border-white/10 rounded px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-white/30"
                />
                <input
                  name="color_primary"
                  type="text"
                  placeholder="Primary #RRGGBB"
                  className="bg-gray-800 border border-white/10 rounded px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-white/30"
                />
                <input
                  name="color_secondary"
                  type="text"
                  placeholder="Secondary #RRGGBB"
                  className="bg-gray-800 border border-white/10 rounded px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-white/30"
                />
              </div>
              {addState.error && <p className="text-red-400 text-xs">{addState.error}</p>}
              {addState.success && <p className="text-green-400 text-xs">Team added.</p>}
              <button
                type="submit"
                disabled={isPending}
                className="bg-white text-gray-950 text-sm font-semibold px-4 py-2 rounded hover:bg-gray-200 disabled:opacity-50 transition-colors"
              >
                Add Team
              </button>
            </form>
          </section>

          {/* Teams List */}
          <section>
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Teams ({teams.length})
            </h2>
            {teams.length === 0 ? (
              <p className="text-gray-500 text-sm">No teams for this season yet.</p>
            ) : (
              <ul className="space-y-2">
                {teams.map((team) => (
                  <li key={team.id} className="bg-gray-900 border border-white/10 rounded p-3">
                    {editingId === team.id ? (
                      <form onSubmit={(e) => handleUpdate(team, e)} className="space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            name="name"
                            type="text"
                            defaultValue={team.name}
                            required
                            className="bg-gray-800 border border-white/20 rounded px-2 py-1.5 text-sm text-white focus:outline-none focus:border-white/40"
                          />
                          <input
                            name="captain_name"
                            type="text"
                            defaultValue={team.captain_name ?? ''}
                            className="bg-gray-800 border border-white/20 rounded px-2 py-1.5 text-sm text-white focus:outline-none focus:border-white/40"
                          />
                          <input
                            name="color_primary"
                            type="text"
                            defaultValue={team.color_primary ?? ''}
                            placeholder="#RRGGBB"
                            className="bg-gray-800 border border-white/20 rounded px-2 py-1.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-white/40"
                          />
                          <input
                            name="color_secondary"
                            type="text"
                            defaultValue={team.color_secondary ?? ''}
                            placeholder="#RRGGBB"
                            className="bg-gray-800 border border-white/20 rounded px-2 py-1.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-white/40"
                          />
                        </div>
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
                          <div className="flex items-center gap-2 min-w-0">
                            <ColorSwatch hex={team.color_primary} />
                            <ColorSwatch hex={team.color_secondary} />
                            <div className="min-w-0">
                              <span className="text-sm font-medium text-white">{team.name}</span>
                              {team.captain_name && (
                                <span className="text-xs text-gray-500 ml-2">
                                  {team.captain_name}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-3 flex-shrink-0">
                            <button
                              onClick={() => startEditing(team.id)}
                              disabled={isPending}
                              className="text-xs text-gray-400 hover:text-white transition-colors disabled:opacity-50"
                            >
                              Edit
                            </button>
                            {deletingId === team.id ? (
                              <span className="flex items-center gap-1.5">
                                <span className="text-xs text-red-400">Delete?</span>
                                <button
                                  onClick={() => handleDelete(team.id)}
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
                                onClick={() => setDeletingId(team.id)}
                                disabled={isPending}
                                className="text-xs text-gray-400 hover:text-red-400 transition-colors disabled:opacity-50"
                              >
                                Delete
                              </button>
                            )}
                          </div>
                        </div>
                        {deleteErrors[team.id] && (
                          <p className="text-red-400 text-xs mt-1">{deleteErrors[team.id]}</p>
                        )}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  )
}
