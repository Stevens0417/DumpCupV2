'use client'

import { useState, useTransition, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { MatchType, MatchTypeAllocation } from '@/types/database'
import {
  createMatchTypeAction,
  updateMatchTypeAction,
  deleteMatchTypeAction,
  saveAllocationsAction,
} from './actions'

type Props = {
  matchTypes: MatchType[]
  selectedMt: MatchType | null
  allocations: MatchTypeAllocation[]
}

type FormState = { error?: string; success?: boolean }

function defaultWeights(n: number): string[] {
  if (n === 2) return ['0.35', '0.15']
  const equal = (1 / n).toFixed(4)
  return Array(n).fill(equal)
}

const inputClass =
  'bg-gray-800 border border-white/10 rounded px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-white/30'
const inputSmClass =
  'bg-gray-800 border border-white/20 rounded px-2 py-1.5 text-sm text-white focus:outline-none focus:border-white/40 w-full'

export default function MatchTypesClient({ matchTypes, selectedMt, allocations }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  // Match type form state
  const [addState, setAddState] = useState<FormState>({})
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editState, setEditState] = useState<FormState>({})
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleteErrors, setDeleteErrors] = useState<Record<string, string>>({})

  // Allocation editor state
  const [allocWeights, setAllocWeights] = useState<string[]>([])
  const [allocState, setAllocState] = useState<FormState>({})

  useEffect(() => {
    if (addState.success) {
      const t = setTimeout(() => setAddState({}), 2000)
      return () => clearTimeout(t)
    }
  }, [addState.success])

  useEffect(() => {
    if (allocState.success) {
      const t = setTimeout(() => setAllocState({}), 2000)
      return () => clearTimeout(t)
    }
  }, [allocState.success])

  // Sync allocation weights when selected match type or allocations change
  useEffect(() => {
    if (!selectedMt) {
      setAllocWeights([])
      setAllocState({})
      return
    }
    const weights: string[] = []
    for (let i = 1; i <= selectedMt.players_per_team; i++) {
      const alloc = allocations.find((a) => a.rank_order === i)
      weights.push(alloc ? String(alloc.percentage_weight) : defaultWeights(selectedMt.players_per_team)[i - 1])
    }
    setAllocWeights(weights)
    setAllocState({})
  }, [selectedMt, allocations])

  function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const formData = new FormData(form)
    startTransition(async () => {
      const result = await createMatchTypeAction(formData)
      if ('error' in result) {
        setAddState({ error: result.error })
      } else {
        setAddState({ success: true })
        form.reset()
        router.refresh()
      }
    })
  }

  function handleUpdate(mt: MatchType, e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await updateMatchTypeAction(mt.id, formData)
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
      const result = await deleteMatchTypeAction(id)
      if ('error' in result) {
        setDeleteErrors((prev) => ({ ...prev, [id]: result.error }))
        setDeletingId(null)
      } else {
        setDeletingId(null)
        // If deleted MT was selected, clear selection
        if (selectedMt?.id === id) {
          router.push('/admin/match-types')
        } else {
          router.refresh()
        }
      }
    })
  }

  function handleSaveAllocations() {
    if (!selectedMt) return
    const rows = allocWeights.map((w, i) => ({
      rank_order: i + 1,
      percentage_weight: parseFloat(w) || 0,
    }))
    startTransition(async () => {
      const result = await saveAllocationsAction(selectedMt.id, rows)
      if ('error' in result) {
        setAllocState({ error: result.error })
      } else {
        setAllocState({ success: true })
        router.refresh()
      }
    })
  }

  return (
    <div className="space-y-10 max-w-2xl">
      {/* ── Add Match Type ── */}
      <section>
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
          Add Match Type
        </h2>
        <form onSubmit={handleCreate} className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <input
              name="name"
              type="text"
              placeholder="Name *"
              required
              className={inputClass}
            />
            <input
              name="notes"
              type="text"
              placeholder="Notes (optional)"
              className={inputClass}
            />
            <div>
              <label className="block text-xs text-gray-500 mb-1">Players per team *</label>
              <input
                name="players_per_team"
                type="number"
                min={1}
                max={4}
                required
                defaultValue={1}
                className={inputClass + ' w-full'}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Handicap allowance *</label>
              <input
                name="handicap_allowance"
                type="number"
                step="0.05"
                min={0}
                max={1}
                required
                defaultValue={1}
                className={inputClass + ' w-full'}
              />
            </div>
          </div>
          {addState.error && <p className="text-red-400 text-xs">{addState.error}</p>}
          {addState.success && <p className="text-green-400 text-xs">Match type created.</p>}
          <button
            type="submit"
            disabled={isPending}
            className="bg-white text-gray-950 text-sm font-semibold px-4 py-2 rounded hover:bg-gray-200 disabled:opacity-50 transition-colors"
          >
            Add
          </button>
        </form>
      </section>

      {/* ── Match Types List ── */}
      <section>
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
          Match Types ({matchTypes.length})
        </h2>
        {matchTypes.length === 0 ? (
          <p className="text-gray-500 text-sm">No match types yet.</p>
        ) : (
          <ul className="space-y-2">
            {matchTypes.map((mt) => (
              <li
                key={mt.id}
                className={`bg-gray-900 border rounded p-3 transition-colors ${
                  selectedMt?.id === mt.id ? 'border-white/30' : 'border-white/10'
                }`}
              >
                {editingId === mt.id ? (
                  <form onSubmit={(e) => handleUpdate(mt, e)} className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        name="name"
                        type="text"
                        defaultValue={mt.name}
                        required
                        className={inputSmClass}
                      />
                      <input
                        name="notes"
                        type="text"
                        defaultValue={mt.notes ?? ''}
                        placeholder="Notes"
                        className={inputSmClass}
                      />
                      <div>
                        <label className="block text-xs text-gray-500 mb-0.5">Players/team</label>
                        <input
                          name="players_per_team"
                          type="number"
                          min={1}
                          max={4}
                          defaultValue={mt.players_per_team}
                          required
                          className={inputSmClass}
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-0.5">HCP allowance</label>
                        <input
                          name="handicap_allowance"
                          type="number"
                          step="0.05"
                          min={0}
                          max={1}
                          defaultValue={mt.handicap_allowance}
                          required
                          className={inputSmClass}
                        />
                      </div>
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
                      <div>
                        <span className="text-sm font-medium text-white">{mt.name}</span>
                        <span className="text-xs text-gray-500 ml-2">
                          {mt.players_per_team}v{mt.players_per_team} · HCP {mt.handicap_allowance}
                        </span>
                        {mt.notes && (
                          <span className="text-xs text-gray-600 ml-2">{mt.notes}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <Link
                          href={`/admin/match-types?mt=${mt.id}`}
                          className={`text-xs transition-colors ${
                            selectedMt?.id === mt.id
                              ? 'text-white font-semibold'
                              : 'text-gray-400 hover:text-white'
                          }`}
                        >
                          Weights
                        </Link>
                        <button
                          onClick={() => { setEditingId(mt.id); setEditState({}) }}
                          disabled={isPending}
                          className="text-xs text-gray-400 hover:text-white transition-colors disabled:opacity-50"
                        >
                          Edit
                        </button>
                        {deletingId === mt.id ? (
                          <span className="flex items-center gap-1.5">
                            <span className="text-xs text-red-400">Delete?</span>
                            <button
                              onClick={() => handleDelete(mt.id)}
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
                            onClick={() => setDeletingId(mt.id)}
                            disabled={isPending}
                            className="text-xs text-gray-400 hover:text-red-400 transition-colors disabled:opacity-50"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                    {deleteErrors[mt.id] && (
                      <p className="text-red-400 text-xs mt-1">{deleteErrors[mt.id]}</p>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ── Handicap Weights Editor ── */}
      {selectedMt && (
        <section>
          <div className="flex items-center gap-3 mb-3">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Handicap Weights — {selectedMt.name}
            </h2>
            <Link
              href="/admin/match-types"
              className="text-xs text-gray-600 hover:text-gray-400 transition-colors"
            >
              ✕ Close
            </Link>
          </div>

          {selectedMt.players_per_team === 1 ? (
            <p className="text-gray-500 text-sm">
              Singles format — no rank weights needed. Handicap allowance applies directly.
            </p>
          ) : (
            <>
              <p className="text-xs text-gray-500 mb-4">
                Rank 1 = lowest handicap on the team. Each weight is multiplied into the team
                handicap calculation. No sum requirement.
              </p>

              <div className="space-y-2 mb-4">
                {allocWeights.map((w, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-xs text-gray-400 w-16 flex-shrink-0">Rank {i + 1}</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={w}
                      onChange={(e) => {
                        const next = [...allocWeights]
                        next[i] = e.target.value
                        setAllocWeights(next)
                        setAllocState({})
                      }}
                      className="w-32 bg-gray-800 border border-white/10 rounded px-3 py-1.5 text-sm text-white focus:outline-none focus:border-white/30"
                    />
                  </div>
                ))}
              </div>

              {allocState.error && (
                <p className="text-red-400 text-xs mb-2">{allocState.error}</p>
              )}
              {allocState.success && (
                <p className="text-green-400 text-xs mb-2">Weights saved.</p>
              )}

              <div className="flex gap-2">
                <button
                  onClick={handleSaveAllocations}
                  disabled={isPending}
                  className="bg-white text-gray-950 text-sm font-semibold px-4 py-2 rounded hover:bg-gray-200 disabled:opacity-50 transition-colors"
                >
                  Save Weights
                </button>
                <button
                  onClick={() => {
                    setAllocWeights(defaultWeights(selectedMt.players_per_team))
                    setAllocState({})
                  }}
                  type="button"
                  disabled={isPending}
                  className="text-sm text-gray-400 hover:text-white px-4 py-2 rounded border border-white/10 hover:border-white/20 transition-colors disabled:opacity-50"
                >
                  Reset to Defaults
                </button>
              </div>
            </>
          )}
        </section>
      )}
    </div>
  )
}
