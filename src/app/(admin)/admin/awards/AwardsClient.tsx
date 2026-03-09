'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { Award, AwardType, Season, Team, Player } from '@/types/database'
import { AWARD_TYPES, AWARD_LABELS } from '@/lib/domain/awards'
import { createAwardAction, updateAwardAction, deleteAwardAction, type AwardInput } from './actions'

type Props = {
  seasons: Season[]
  selectedSeasonId: string
  teams: Team[]
  players: Player[]
  awards: Award[]
}

const EMPTY_FORM: AwardInput = {
  award: 'other',
  team_id: null,
  team_captain: null,
  final_score: null,
  player_id: null,
  net_points: null,
  notes: null,
}

type FormMode = 'closed' | 'add' | { kind: 'edit'; award: Award }

export default function AwardsClient({
  seasons,
  selectedSeasonId,
  teams,
  players,
  awards,
}: Props) {
  const router = useRouter()
  const [formMode, setFormMode] = useState<FormMode>('closed')
  const [form, setForm] = useState<AwardInput>(EMPTY_FORM)
  const [formError, setFormError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [isDeleting, startDeleteTransition] = useTransition()

  function handleSeasonChange(seasonId: string) {
    router.push(`/admin/awards?season=${seasonId}`)
  }

  function openAdd() {
    setForm(EMPTY_FORM)
    setFormError(null)
    setFormMode('add')
  }

  function openEdit(award: Award) {
    setForm({
      award: award.award,
      team_id: award.team_id,
      team_captain: award.team_captain,
      final_score: award.final_score,
      player_id: award.player_id,
      net_points: award.net_points,
      notes: award.notes,
    })
    setFormError(null)
    setFormMode({ kind: 'edit', award })
  }

  function closeForm() {
    setFormMode('closed')
    setFormError(null)
  }

  function setField<K extends keyof AwardInput>(key: K, value: AwardInput[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFormError(null)

    startTransition(async () => {
      const result =
        formMode === 'add'
          ? await createAwardAction(selectedSeasonId, form)
          : await updateAwardAction((formMode as { kind: 'edit'; award: Award }).award.id, form)

      if ('error' in result) {
        setFormError(result.error)
      } else {
        closeForm()
        router.refresh()
      }
    })
  }

  function handleDeleteConfirm(id: string) {
    setDeleteId(id)
    setDeleteError(null)
  }

  function handleDeleteExecute() {
    if (!deleteId) return
    startDeleteTransition(async () => {
      const result = await deleteAwardAction(deleteId)
      if ('error' in result) {
        setDeleteError(result.error)
      } else {
        setDeleteId(null)
        setDeleteError(null)
        router.refresh()
      }
    })
  }

  function playerName(id: string | null) {
    if (!id) return null
    return players.find((p) => p.id === id)?.full_name ?? null
  }

  function teamName(id: string | null) {
    if (!id) return null
    return teams.find((t) => t.id === id)?.name ?? null
  }

  const showForm = formMode !== 'closed'
  const inputCls = 'w-full bg-gray-800 border border-white/20 rounded px-3 py-2 text-sm text-white placeholder:text-gray-600'
  const labelCls = 'block text-xs text-gray-400 mb-1'

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-xl font-bold">Awards</h1>

      {/* Season selector + Add button */}
      <div className="flex items-end gap-4 flex-wrap">
        <div>
          <label className={labelCls}>Season</label>
          <select
            className="bg-gray-800 border border-white/20 rounded px-3 py-2 text-sm text-white"
            value={selectedSeasonId}
            onChange={(e) => handleSeasonChange(e.target.value)}
          >
            {seasons.map((s) => (
              <option key={s.id} value={s.id}>
                {s.year}
              </option>
            ))}
          </select>
        </div>
        {!showForm && (
          <button
            onClick={openAdd}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded transition-colors"
          >
            + Add Award
          </button>
        )}
      </div>

      {/* Delete confirm */}
      {deleteId && (
        <div className="rounded-lg border border-red-500/40 bg-red-950/30 p-4 flex items-center gap-4 flex-wrap">
          <p className="text-sm text-red-300 flex-1">Delete this award? This cannot be undone.</p>
          {deleteError && <p className="text-red-400 text-sm">{deleteError}</p>}
          <div className="flex gap-2">
            <button
              onClick={handleDeleteExecute}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-sm px-4 py-1.5 rounded"
            >
              {isDeleting ? 'Deleting…' : 'Delete'}
            </button>
            <button
              onClick={() => setDeleteId(null)}
              disabled={isDeleting}
              className="border border-white/20 text-gray-400 hover:text-white text-sm px-4 py-1.5 rounded"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Add / Edit form */}
      {showForm && (
        <div className="rounded-xl border border-white/10 bg-gray-800/60 p-5">
          <h2 className="text-sm font-semibold text-white mb-4">
            {formMode === 'add' ? 'New Award' : 'Edit Award'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            {formError && <p className="text-red-400 text-sm">{formError}</p>}

            {/* Award type + Player */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Award *</label>
                <select
                  required
                  className={inputCls}
                  value={form.award}
                  onChange={(e) => setField('award', e.target.value as AwardType)}
                >
                  {AWARD_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {AWARD_LABELS[t]}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls}>Player</label>
                <select
                  className={inputCls}
                  value={form.player_id ?? ''}
                  onChange={(e) => setField('player_id', e.target.value || null)}
                >
                  <option value="">— none —</option>
                  {players.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.full_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Team + Team Captain */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Team</label>
                <select
                  className={inputCls}
                  value={form.team_id ?? ''}
                  onChange={(e) => setField('team_id', e.target.value || null)}
                >
                  <option value="">— none —</option>
                  {teams.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls}>Team Captain</label>
                <input
                  type="text"
                  className={inputCls}
                  value={form.team_captain ?? ''}
                  onChange={(e) => setField('team_captain', e.target.value || null)}
                  placeholder="Name"
                />
              </div>
            </div>

            {/* Final Score + Net Points */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Final Score</label>
                <input
                  type="text"
                  className={inputCls}
                  value={form.final_score ?? ''}
                  onChange={(e) => setField('final_score', e.target.value || null)}
                  placeholder="e.g. 14-10"
                />
              </div>
              <div>
                <label className={labelCls}>Net Points</label>
                <input
                  type="number"
                  step="any"
                  className={inputCls}
                  value={form.net_points ?? ''}
                  onChange={(e) =>
                    setField('net_points', e.target.value !== '' ? parseFloat(e.target.value) : null)
                  }
                  placeholder="0.0"
                />
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className={labelCls}>Notes</label>
              <textarea
                rows={2}
                className={inputCls}
                value={form.notes ?? ''}
                onChange={(e) => setField('notes', e.target.value || null)}
                placeholder="Optional notes"
              />
            </div>

            <div className="flex gap-3 pt-1">
              <button
                type="submit"
                disabled={isPending}
                className="bg-green-700 hover:bg-green-600 disabled:opacity-50 text-white text-sm font-medium px-5 py-2 rounded transition-colors"
              >
                {isPending ? 'Saving…' : 'Save'}
              </button>
              <button
                type="button"
                onClick={closeForm}
                disabled={isPending}
                className="text-sm text-gray-400 hover:text-white border border-white/20 rounded px-4 py-2 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Awards list */}
      <div className="overflow-x-auto rounded-lg border border-white/10">
        <table className="w-full text-sm min-w-[640px]">
          <thead>
            <tr className="bg-gray-800 border-b border-white/10 text-left">
              <th className="px-3 py-2.5 text-xs font-medium text-gray-400">Award</th>
              <th className="px-3 py-2.5 text-xs font-medium text-gray-400">Player</th>
              <th className="px-3 py-2.5 text-xs font-medium text-gray-400">Team</th>
              <th className="px-3 py-2.5 text-xs font-medium text-gray-400">Captain</th>
              <th className="px-3 py-2.5 text-xs font-medium text-gray-400">Score</th>
              <th className="px-3 py-2.5 text-xs font-medium text-gray-400 text-center w-24">
                Net Pts
              </th>
              <th className="px-3 py-2.5 text-xs font-medium text-gray-400">Notes</th>
              <th className="px-3 py-2.5 text-xs font-medium text-gray-400 w-24" />
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {awards.map((a) => (
              <tr key={a.id} className="bg-gray-900 hover:bg-gray-800/60 transition-colors">
                <td className="px-3 py-2 font-medium text-white whitespace-nowrap">
                  {AWARD_LABELS[a.award]}
                </td>
                <td className="px-3 py-2 text-gray-300 whitespace-nowrap text-xs">
                  {playerName(a.player_id) ?? <span className="text-gray-600">—</span>}
                </td>
                <td className="px-3 py-2 text-gray-300 whitespace-nowrap text-xs">
                  {teamName(a.team_id) ?? <span className="text-gray-600">—</span>}
                </td>
                <td className="px-3 py-2 text-gray-400 text-xs">
                  {a.team_captain ?? <span className="text-gray-600">—</span>}
                </td>
                <td className="px-3 py-2 text-gray-400 text-xs">
                  {a.final_score ?? <span className="text-gray-600">—</span>}
                </td>
                <td className="px-3 py-2 text-center tabular-nums text-gray-300 text-xs">
                  {a.net_points !== null ? a.net_points : <span className="text-gray-600">—</span>}
                </td>
                <td className="px-3 py-2 text-gray-400 text-xs max-w-[180px] truncate">
                  {a.notes ?? <span className="text-gray-600">—</span>}
                </td>
                <td className="px-3 py-2">
                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={() => openEdit(a)}
                      disabled={showForm}
                      className="text-xs text-blue-400 hover:text-blue-300 disabled:opacity-40"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteConfirm(a.id)}
                      disabled={isDeleting || showForm}
                      className="text-xs text-red-400 hover:text-red-300 disabled:opacity-40"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {awards.length === 0 && (
          <p className="text-center text-gray-500 text-sm py-10">
            No awards yet for this season. Click &ldquo;+ Add Award&rdquo; to get started.
          </p>
        )}
      </div>
    </div>
  )
}
