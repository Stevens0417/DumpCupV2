'use client'

import { useState, useTransition, useMemo } from 'react'
import type { Match, MatchPlayer, MatchType, Team } from '@/types/database'
import type { PlayerWithTeam } from '@/lib/db/tournamentUtils'
import { createYearendMatchAction, updateYearendMatchAction, type YearendMatchInput } from './actions'

type Props = {
  tournamentId: string
  tournamentDate: string | null
  seasonId: string
  matchType: MatchType
  teams: Team[]
  playersWithTeams: PlayerWithTeam[]
  defaultMatchPoints: string
  editMatch?: Match
  editMatchPlayers?: MatchPlayer[]
  onSuccess: () => void
  onCancel: () => void
}

function parseNum(val: string): number | null {
  const n = parseFloat(val)
  return isNaN(n) ? null : n
}

export default function YearendMatchForm({
  tournamentId,
  tournamentDate,
  seasonId,
  matchType,
  teams,
  playersWithTeams,
  defaultMatchPoints,
  editMatch,
  editMatchPlayers,
  onSuccess,
  onCancel,
}: Props) {
  const isEdit = !!editMatch
  const today = new Date().toISOString().split('T')[0]
  const allowance = matchType.handicap_allowance

  // ── Team detection ──────────────────────────────────────────────────────────
  const dresdenTeam = useMemo(
    () => teams.find((t) => t.name.toLowerCase().includes('dresden')) ?? null,
    [teams]
  )
  const yorkTeam = useMemo(
    () => teams.find((t) => t.name.toLowerCase().includes('york')) ?? null,
    [teams]
  )

  // ── Eligible players filtered by team ───────────────────────────────────────
  const eligibleAll = useMemo(
    () => playersWithTeams.filter((p) => p.team_id !== null),
    [playersWithTeams]
  )
  const dresdeniPlayers = useMemo(
    () => (dresdenTeam ? eligibleAll.filter((p) => p.team_id === dresdenTeam.id) : []),
    [eligibleAll, dresdenTeam]
  )
  const yorkPlayers = useMemo(
    () => (yorkTeam ? eligibleAll.filter((p) => p.team_id === yorkTeam.id) : []),
    [eligibleAll, yorkTeam]
  )

  // ── Edit init helpers ────────────────────────────────────────────────────────
  const initPlayerAId = () => {
    if (!editMatch || !editMatchPlayers) return ''
    return editMatchPlayers.find((mp) => mp.team_id === editMatch.team_a_id)?.player_id ?? ''
  }
  const initPlayerBId = () => {
    if (!editMatch || !editMatchPlayers) return ''
    return editMatchPlayers.find((mp) => mp.team_id === editMatch.team_b_id)?.player_id ?? ''
  }
  const initHandicapA = () => {
    if (editMatch?.team_a_handicap != null) return String(editMatch.team_a_handicap)
    return ''
  }
  const initHandicapB = () => {
    if (editMatch?.team_b_handicap != null) return String(editMatch.team_b_handicap)
    return ''
  }

  // ── Form state ───────────────────────────────────────────────────────────────
  const [matchDate, setMatchDate] = useState(editMatch?.match_date ?? tournamentDate ?? today)
  const [playerAId, setPlayerAId] = useState(initPlayerAId)
  const [playerBId, setPlayerBId] = useState(initPlayerBId)
  const [handicapAStr, setHandicapAStr] = useState(initHandicapA)
  const [handicapBStr, setHandicapBStr] = useState(initHandicapB)
  const [grossA, setGrossA] = useState(
    editMatch?.team_a_gross != null ? String(editMatch.team_a_gross) : ''
  )
  const [grossB, setGrossB] = useState(
    editMatch?.team_b_gross != null ? String(editMatch.team_b_gross) : ''
  )
  const [matchPoints, setMatchPoints] = useState(
    editMatch?.match_points != null ? String(editMatch.match_points) : defaultMatchPoints
  )
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  // ── Derived ──────────────────────────────────────────────────────────────────
  const playerA = useMemo(
    () => eligibleAll.find((p) => p.id === playerAId) ?? null,
    [eligibleAll, playerAId]
  )
  const playerB = useMemo(
    () => eligibleAll.find((p) => p.id === playerBId) ?? null,
    [eligibleAll, playerBId]
  )

  const handicapANum = parseNum(handicapAStr)
  const handicapBNum = parseNum(handicapBStr)
  const grossANum = parseNum(grossA)
  const grossBNum = parseNum(grossB)
  const netA = grossANum !== null && handicapANum !== null ? grossANum - handicapANum : null
  const netB = grossBNum !== null && handicapBNum !== null ? grossBNum - handicapBNum : null

  const winner: 'A' | 'B' | 'tie' | null =
    netA !== null && netB !== null
      ? netA < netB
        ? 'A'
        : netB < netA
          ? 'B'
          : 'tie'
      : null

  const matchPointsNum = parseNum(matchPoints)
  const isTie = winner === 'tie'
  const teamAPoints =
    matchPointsNum !== null && winner !== null ? (winner === 'A' ? matchPointsNum : 0) : 0
  const teamBPoints =
    matchPointsNum !== null && winner !== null ? (winner === 'B' ? matchPointsNum : 0) : 0

  // ── Player change handlers — auto-fill handicap from default ─────────────────
  function handlePlayerAChange(id: string) {
    setPlayerAId(id)
    const p = dresdeniPlayers.find((pl) => pl.id === id)
    setHandicapAStr(p ? String(Math.round(p.handicap * allowance)) : '')
  }

  function handlePlayerBChange(id: string) {
    setPlayerBId(id)
    const p = yorkPlayers.find((pl) => pl.id === id)
    setHandicapBStr(p ? String(Math.round(p.handicap * allowance)) : '')
  }

  // ── Submit ───────────────────────────────────────────────────────────────────
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!dresdenTeam || !yorkTeam) {
      return setError('Dresden or York team not found for this season.')
    }
    if (!matchDate) return setError('Match date is required.')
    if (!playerAId || !playerBId) return setError('Select both players.')
    if (playerAId === playerBId) return setError('Players must be different.')
    if (!playerA?.team_id || !playerB?.team_id) return setError('Both players must be on a team.')

    const input: YearendMatchInput = {
      tournament_id: tournamentId,
      season_id: seasonId,
      match_date: matchDate,
      holes: 18,
      match_type_id: matchType.id,
      team_a_id: playerA.team_id,
      team_b_id: playerB.team_id,
      team_a_handicap: handicapANum,
      team_b_handicap: handicapBNum,
      team_a_gross: grossANum !== null ? Math.round(grossANum) : null,
      team_b_gross: grossBNum !== null ? Math.round(grossBNum) : null,
      team_a_net: netA,
      team_b_net: netB,
      team_a_points: teamAPoints,
      team_b_points: teamBPoints,
      match_points: matchPointsNum,
      notes: null,
      player_a: {
        player_id: playerAId,
        team_id: playerA.team_id,
        handicap_used: handicapANum,
        points_earned: winner === 'A' ? (matchPointsNum ?? 0) : 0,
      },
      player_b: {
        player_id: playerBId,
        team_id: playerB.team_id,
        handicap_used: handicapBNum,
        points_earned: winner === 'B' ? (matchPointsNum ?? 0) : 0,
      },
    }

    startTransition(async () => {
      const result = isEdit
        ? await updateYearendMatchAction(editMatch!.id, input)
        : await createYearendMatchAction(input)
      if ('error' in result) setError(result.error)
      else onSuccess()
    })
  }

  const inputCls = 'w-full bg-gray-800 border border-white/20 rounded px-3 py-2 text-sm text-white'
  const readonlyCls = 'w-full bg-gray-900 border border-white/10 rounded px-3 py-2 text-sm text-gray-400'
  const labelCls = 'block text-xs text-gray-400 mb-1'

  // ── Team setup guard ─────────────────────────────────────────────────────────
  if (!dresdenTeam || !yorkTeam) {
    return (
      <p className="text-yellow-400 text-sm">
        {!dresdenTeam && !yorkTeam
          ? 'Dresden and York teams not found for this season.'
          : !dresdenTeam
            ? 'Dresden team not found for this season.'
            : 'York team not found for this season.'}{' '}
        Set up teams before adding Year-End matches.
      </p>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <p className="text-red-400 text-sm">{error}</p>}

      {/* Date */}
      <div className="w-48">
        <label className={labelCls}>Match Date *</label>
        <input
          type="date"
          className={inputCls}
          value={matchDate}
          onChange={(e) => setMatchDate(e.target.value)}
          required
        />
      </div>

      {/* Players — filtered by team */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Player A — {dresdenTeam.name} *</label>
          <select
            className={inputCls}
            value={playerAId}
            onChange={(e) => handlePlayerAChange(e.target.value)}
            required
          >
            <option value="">— select player —</option>
            {dresdeniPlayers.map((p) => (
              <option key={p.id} value={p.id} disabled={p.id === playerBId}>
                {p.full_name}
              </option>
            ))}
          </select>
          {dresdeniPlayers.length === 0 && (
            <p className="text-xs text-yellow-400 mt-1">
              No players on {dresdenTeam.name} for this date.
            </p>
          )}
        </div>
        <div>
          <label className={labelCls}>Player B — {yorkTeam.name} *</label>
          <select
            className={inputCls}
            value={playerBId}
            onChange={(e) => handlePlayerBChange(e.target.value)}
            required
          >
            <option value="">— select player —</option>
            {yorkPlayers.map((p) => (
              <option key={p.id} value={p.id} disabled={p.id === playerAId}>
                {p.full_name}
              </option>
            ))}
          </select>
          {yorkPlayers.length === 0 && (
            <p className="text-xs text-yellow-400 mt-1">
              No players on {yorkTeam.name} for this date.
            </p>
          )}
        </div>
      </div>

      {/* Scores grid */}
      <div>
        <p className="text-xs font-medium text-gray-300 mb-2">Scores</p>
        <div className="grid grid-cols-4 gap-2">
          {/* Headers */}
          <div className="text-xs text-gray-500 pb-1">HCP A</div>
          <div className="text-xs text-gray-500 pb-1">HCP B</div>
          <div className="text-xs text-gray-500 pb-1">Gross A</div>
          <div className="text-xs text-gray-500 pb-1">Gross B</div>

          {/* Handicap inputs (editable, auto-filled on player select) */}
          <div>
            <input
              type="number"
              step="any"
              className={inputCls}
              value={handicapAStr}
              onChange={(e) => setHandicapAStr(e.target.value)}
              placeholder="—"
            />
          </div>
          <div>
            <input
              type="number"
              step="any"
              className={inputCls}
              value={handicapBStr}
              onChange={(e) => setHandicapBStr(e.target.value)}
              placeholder="—"
            />
          </div>

          {/* Gross inputs */}
          <div>
            <input
              type="number"
              className={inputCls}
              value={grossA}
              onChange={(e) => setGrossA(e.target.value)}
              placeholder="—"
              min={18}
              max={200}
            />
          </div>
          <div>
            <input
              type="number"
              className={inputCls}
              value={grossB}
              onChange={(e) => setGrossB(e.target.value)}
              placeholder="—"
              min={18}
              max={200}
            />
          </div>

          {/* Net (computed, read-only) */}
          <div className="text-xs text-gray-500 pt-2 col-span-2">Net A / Net B</div>
          <div className={readonlyCls}>
            {netA !== null ? netA : <span className="opacity-40">—</span>}
          </div>
          <div className={readonlyCls}>
            {netB !== null ? netB : <span className="opacity-40">—</span>}
          </div>
        </div>

        {/* Winner indicator */}
        {winner && (
          <p className="mt-2 text-xs font-medium">
            {isTie ? (
              <span className="text-yellow-400">Tie — no points awarded</span>
            ) : (
              <span className="text-green-400">
                {winner === 'A'
                  ? (playerA?.full_name ?? 'Player A')
                  : (playerB?.full_name ?? 'Player B')}{' '}
                wins
              </span>
            )}
          </p>
        )}
      </div>

      {/* Match Points */}
      <div className="w-48">
        <label className={labelCls}>Match Points</label>
        <input
          type="number"
          step="any"
          className={inputCls}
          value={matchPoints}
          onChange={(e) => setMatchPoints(e.target.value)}
          placeholder="e.g. 4"
        />
        {matchPointsNum !== null && winner !== null && !isTie && (
          <p className="mt-1 text-xs text-gray-400">
            Winner earns <span className="text-white">{matchPointsNum}</span> pts, loser earns 0.
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-1">
        <button
          type="submit"
          disabled={isPending}
          className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium py-2 rounded"
        >
          {isPending ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Match'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm text-gray-400 hover:text-white border border-white/20 rounded"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
