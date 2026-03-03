'use client'

import { useState, useTransition, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { Player } from '@/types/database'
import { createPlayerAction, updatePlayerAction, togglePlayerActiveAction } from './actions'

type Props = { players: Player[] }
type FormState = { error?: string; success?: boolean }

export default function PlayersClient({ players }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [addState, setAddState] = useState<FormState>({})
  const [editState, setEditState] = useState<FormState>({})

  useEffect(() => {
    if (addState.success) {
      const t = setTimeout(() => setAddState({}), 2000)
      return () => clearTimeout(t)
    }
  }, [addState.success])

  function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const formData = new FormData(form)
    startTransition(async () => {
      const result = await createPlayerAction(formData)
      if ('error' in result) {
        setAddState({ error: result.error })
      } else {
        setAddState({ success: true })
        form.reset()
        router.refresh()
      }
    })
  }

  function handleUpdate(player: Player, e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await updatePlayerAction(player.id, formData)
      if ('error' in result) {
        setEditState({ error: result.error })
      } else {
        setEditingId(null)
        setEditState({})
        router.refresh()
      }
    })
  }

  function handleToggleActive(player: Player) {
    startTransition(async () => {
      const result = await togglePlayerActiveAction(player.id, !player.is_active)
      if ('error' in result) {
        setAddState({ error: result.error })
      } else {
        router.refresh()
      }
    })
  }

  function startEditing(id: string) {
    setEditingId(id)
    setEditState({})
  }

  function cancelEditing() {
    setEditingId(null)
    setEditState({})
  }

  return (
    <div className="space-y-8 max-w-2xl">
      {/* Add Player */}
      <section>
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
          Add Player
        </h2>
        <form onSubmit={handleCreate} className="space-y-2">
          <div className="flex gap-2">
            <input
              name="full_name"
              type="text"
              placeholder="Full name"
              required
              className="flex-1 bg-gray-800 border border-white/10 rounded px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-white/30"
            />
            <input
              name="handicap"
              type="number"
              step="0.1"
              defaultValue={0}
              min={-10}
              max={54}
              required
              className="w-20 bg-gray-800 border border-white/10 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-white/30"
            />
            <input type="hidden" name="is_active" value="true" />
            <button
              type="submit"
              disabled={isPending}
              className="bg-white text-gray-950 text-sm font-semibold px-4 py-2 rounded hover:bg-gray-200 disabled:opacity-50 transition-colors"
            >
              Add
            </button>
          </div>
          {addState.error && <p className="text-red-400 text-xs">{addState.error}</p>}
          {addState.success && <p className="text-green-400 text-xs">Player added.</p>}
        </form>
      </section>

      {/* Player List */}
      <section>
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
          Players ({players.length})
        </h2>
        {players.length === 0 ? (
          <p className="text-gray-500 text-sm">No players yet.</p>
        ) : (
          <ul className="space-y-2">
            {players.map((player) => (
              <li
                key={player.id}
                className={`bg-gray-900 border rounded p-3 transition-opacity ${
                  player.is_active ? 'border-white/10' : 'border-white/5 opacity-50'
                }`}
              >
                {editingId === player.id ? (
                  <form onSubmit={(e) => handleUpdate(player, e)} className="space-y-2">
                    <div className="flex gap-2">
                      <input
                        name="full_name"
                        type="text"
                        defaultValue={player.full_name}
                        required
                        className="flex-1 bg-gray-800 border border-white/20 rounded px-2 py-1.5 text-sm text-white focus:outline-none focus:border-white/40"
                      />
                      <input
                        name="handicap"
                        type="number"
                        step="0.1"
                        defaultValue={player.handicap}
                        min={-10}
                        max={54}
                        required
                        className="w-20 bg-gray-800 border border-white/20 rounded px-2 py-1.5 text-sm text-white focus:outline-none focus:border-white/40"
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
                        onClick={cancelEditing}
                        className="text-xs text-gray-400 hover:text-white px-3 py-1 rounded transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <span className="text-sm font-medium text-white">{player.full_name}</span>
                      <span className="text-xs text-gray-500 ml-2">HCP {player.handicap}</span>
                      {!player.is_active && (
                        <span className="ml-2 text-xs text-gray-600">inactive</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <button
                        onClick={() => startEditing(player.id)}
                        disabled={isPending}
                        className="text-xs text-gray-400 hover:text-white transition-colors disabled:opacity-50"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleToggleActive(player)}
                        disabled={isPending}
                        className="text-xs text-gray-400 hover:text-white transition-colors disabled:opacity-50"
                      >
                        {player.is_active ? 'Deactivate' : 'Reactivate'}
                      </button>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
