'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { Season, Team, Player, Roster, DerivedTrade } from '@/types/database'
import { executeTradeAction, type TradeInput } from './actions'

type Props = {
  seasons: Season[]
  selectedSeasonId: string
  teams: Team[]
  players: Player[]
  activeRosters: Roster[]
  trades: DerivedTrade[]
}

const EMPTY_FORM: TradeInput = {
  player_id: '',
  new_team_id: '',
  trade_date: '',
  handicap_at_trade: null,
}

export default function TradesClient({
  seasons,
  selectedSeasonId,
  teams,
  players,
  activeRosters,
  trades,
}: Props) {
  const router = useRouter()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<TradeInput>(EMPTY_FORM)
  const [formError, setFormError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const rosterByPlayer = Object.fromEntries(activeRosters.map((r) => [r.player_id, r]))
  const tradeablePlayers = players.filter((p) => rosterByPlayer[p.id])
  const currentRoster = form.player_id ? rosterByPlayer[form.player_id] : null
  const currentTeam = currentRoster ? teams.find((t) => t.id === currentRoster.team_id) : null

  function handleSeasonChange(seasonId: string) {
    router.push(`/admin/trades?season=${seasonId}`)
  }

  function openForm() {
    setForm(EMPTY_FORM)
    setFormError(null)
    setShowForm(true)
  }

  function closeForm() {
    setShowForm(false)
    setFormError(null)
  }

  function handlePlayerChange(playerId: string) {
    const roster = rosterByPlayer[playerId]
    setForm((prev) => ({
      ...prev,
      player_id: playerId,
      new_team_id: '',
      handicap_at_trade: roster?.handicap_at_draft ?? null,
    }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFormError(null)
    startTransition(async () => {
      const result = await executeTradeAction(selectedSeasonId, form)
      if ('error' in result) {
        setFormError(result.error)
      } else {
        closeForm()
        router.refresh()
      }
    })
  }

  function playerName(id: string) {
    return players.find((p) => p.id === id)?.full_name ?? id
  }

  function teamName(id: string) {
    return teams.find((t) => t.id === id)?.name ?? id
  }

  const inputCls =
    'w-full bg-gray-800 border border-white/20 rounded px-3 py-2 text-sm text-white'
  const labelCls = 'block text-xs text-gray-400 mb-1'

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-xl font-bold">Trades</h1>

      {/* Season selector + Execute Trade button */}
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
            onClick={openForm}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded transition-colors"
          >
            + Execute Trade
          </button>
        )}
      </div>

      {/* Trade form */}
      {showForm && (
        <div className="rounded-xl border border-white/10 bg-gray-800/60 p-5">
          <h2 className="text-sm font-semibold text-white mb-4">New Trade</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            {formError && <p className="text-red-400 text-sm">{formError}</p>}

            {/* Player */}
            <div>
              <label className={labelCls}>Player *</label>
              <select
                required
                className={inputCls}
                value={form.player_id}
                onChange={(e) => handlePlayerChange(e.target.value)}
              >
                <option value="">— select player —</option>
                {tradeablePlayers.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.full_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Current team (read-only) */}
            <div>
              <label className={labelCls}>Current Team</label>
              <div className="w-full bg-gray-900 border border-white/10 rounded px-3 py-2 text-sm text-gray-400">
                {currentTeam ? currentTeam.name : '—'}
              </div>
            </div>

            {/* New team + Trade date */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>New Team *</label>
                <select
                  required
                  className={inputCls}
                  value={form.new_team_id}
                  onChange={(e) => setForm((prev) => ({ ...prev, new_team_id: e.target.value }))}
                >
                  <option value="">— select team —</option>
                  {teams
                    .filter((t) => t.id !== currentRoster?.team_id)
                    .map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                </select>
              </div>
              <div>
                <label className={labelCls}>Trade Date *</label>
                <input
                  required
                  type="date"
                  className={inputCls}
                  value={form.trade_date}
                  onChange={(e) => setForm((prev) => ({ ...prev, trade_date: e.target.value }))}
                />
              </div>
            </div>

            {/* Handicap at trade */}
            <div>
              <label className={labelCls}>Handicap at Trade</label>
              <input
                type="number"
                step="any"
                className={inputCls}
                value={form.handicap_at_trade ?? ''}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    handicap_at_trade: e.target.value !== '' ? parseFloat(e.target.value) : null,
                  }))
                }
                placeholder="e.g. 18.4"
              />
            </div>

            <div className="flex gap-3 pt-1">
              <button
                type="submit"
                disabled={isPending}
                className="bg-green-700 hover:bg-green-600 disabled:opacity-50 text-white text-sm font-medium px-5 py-2 rounded transition-colors"
              >
                {isPending ? 'Saving…' : 'Execute Trade'}
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

      {/* Trade history */}
      <div>
        <h2 className="text-sm font-semibold text-gray-400 mb-3">Trade History</h2>
        <div className="overflow-x-auto rounded-lg border border-white/10">
          <table className="w-full text-sm min-w-[480px]">
            <thead>
              <tr className="bg-gray-800 border-b border-white/10 text-left">
                <th className="px-3 py-2.5 text-xs font-medium text-gray-400">Player</th>
                <th className="px-3 py-2.5 text-xs font-medium text-gray-400">From</th>
                <th className="px-3 py-2.5 text-xs font-medium text-gray-400">To</th>
                <th className="px-3 py-2.5 text-xs font-medium text-gray-400">Trade Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {trades.map((t, i) => (
                <tr key={i} className="bg-gray-900 hover:bg-gray-800/60 transition-colors">
                  <td className="px-3 py-2 text-white text-sm">{playerName(t.player_id)}</td>
                  <td className="px-3 py-2 text-gray-400 text-xs">{teamName(t.from_team_id)}</td>
                  <td className="px-3 py-2 text-gray-300 text-xs">{teamName(t.to_team_id)}</td>
                  <td className="px-3 py-2 text-gray-400 text-xs tabular-nums">{t.trade_date}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {trades.length === 0 && (
            <p className="text-center text-gray-500 text-sm py-10">No trades yet this season.</p>
          )}
        </div>
      </div>
    </div>
  )
}
