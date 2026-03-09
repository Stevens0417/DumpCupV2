'use client'

import { useState, useTransition, useMemo, useEffect, useRef } from 'react'
import type {
  Match,
  MatchPlayer,
  MatchType,
  MatchTypeAllocation,
  Team,
  Player,
  Roster,
} from '@/types/database'
import { calcTeamHandicap } from '@/lib/domain/handicaps/calcTeamHandicap'
import {
  createMidseasonMatchAction,
  updateMidseasonMatchAction,
  getMidseasonAllocationsAction,
  type MidseasonMatchInput,
} from './actions'

type Props = {
  tournamentId: string
  tournamentDate: string | null
  seasonId: string
  matchTypes: MatchType[]
  allAllocations: MatchTypeAllocation[]
  teams: Team[]
  players: Player[]
  rosters: Roster[]
  editMatch?: Match
  editMatchPlayers?: MatchPlayer[]
  onSuccess: () => void
  onCancel: () => void
}

function getEligiblePlayerIds(rosters: Roster[], teamId: string, matchDate: string): Set<string> {
  if (!teamId || !matchDate) return new Set()
  return new Set(
    rosters
      .filter(
        (r) =>
          r.team_id === teamId &&
          r.effective_from <= matchDate &&
          (r.effective_to === null || r.effective_to >= matchDate)
      )
      .map((r) => r.player_id)
  )
}

function allocationsToWeights(allocs: MatchTypeAllocation[]): Record<number, number> {
  if (allocs.length === 0) return { 1: 1 }
  return Object.fromEntries(allocs.map((a) => [a.rank_order, a.percentage_weight]))
}

function parseNum(val: string): number | null {
  const n = parseFloat(val)
  return isNaN(n) ? null : n
}
function parseIntOrNull(val: string): number | null {
  const n = parseInt(val, 10)
  return isNaN(n) ? null : n
}

export default function MidseasonMatchForm({
  tournamentId,
  tournamentDate,
  seasonId,
  matchTypes,
  allAllocations,
  teams,
  players,
  rosters,
  editMatch,
  editMatchPlayers,
  onSuccess,
  onCancel,
}: Props) {
  const isEdit = !!editMatch

  const defaultDate =
    editMatch?.match_date ?? tournamentDate ?? new Date().toISOString().split('T')[0]

  const [matchDate, setMatchDate] = useState(defaultDate)
  const [matchTypeId, setMatchTypeId] = useState(editMatch?.match_type_id ?? '')
  const [teamAId, setTeamAId] = useState(editMatch?.team_a_id ?? '')
  const [teamBId, setTeamBId] = useState(editMatch?.team_b_id ?? '')
  const [teamAGross, setTeamAGross] = useState(
    editMatch?.team_a_gross != null ? String(editMatch.team_a_gross) : ''
  )
  const [teamBGross, setTeamBGross] = useState(
    editMatch?.team_b_gross != null ? String(editMatch.team_b_gross) : ''
  )
  const [matchPoints, setMatchPoints] = useState(
    editMatch?.match_points != null ? String(editMatch.match_points) : ''
  )
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  // Allocations — fetched fresh per match-type change
  const [matchTypeAllocations, setMatchTypeAllocations] = useState<MatchTypeAllocation[]>(() =>
    allAllocations.filter((a) => a.match_type_id === (editMatch?.match_type_id ?? ''))
  )
  const [allocationsLoading, setAllocationsLoading] = useState(false)
  const loadedForRef = useRef(editMatch?.match_type_id ?? '')

  useEffect(() => {
    if (!matchTypeId || matchTypeId === loadedForRef.current) return
    loadedForRef.current = matchTypeId
    setAllocationsLoading(true)
    setMatchTypeAllocations([])
    getMidseasonAllocationsAction(matchTypeId).then((result) => {
      setMatchTypeAllocations('data' in result ? result.data : [])
      setAllocationsLoading(false)
    })
  }, [matchTypeId])

  // Default to Dresden / York in add mode
  const teamDefaultsAppliedRef = useRef(false)
  useEffect(() => {
    if (isEdit || teamDefaultsAppliedRef.current || teams.length === 0) return
    const dresden = teams.find((t) => t.name.toLowerCase().includes('dresden'))
    const york = teams.find((t) => t.name.toLowerCase().includes('york'))
    if (dresden && york) {
      setTeamAId(dresden.id)
      setTeamBId(york.id)
      teamDefaultsAppliedRef.current = true
    }
  }, [teams, isEdit])

  const selectedMatchType = useMemo(
    () => matchTypes.find((mt) => mt.id === matchTypeId) ?? null,
    [matchTypes, matchTypeId]
  )
  const N = selectedMatchType?.players_per_team ?? 0

  // ── Slot + handicap init helpers ─────────────────────────────────────────────
  function initSlots(tId: string): string[] {
    if (!isEdit || !editMatchPlayers) return Array(N).fill('')
    const teamPlayers = editMatchPlayers.filter((mp) => mp.team_id === tId)
    return Array.from({ length: N }, (_, i) => teamPlayers[i]?.player_id ?? '')
  }

  function initHandicapStrs(tId: string): string[] {
    if (!isEdit || !editMatchPlayers) return Array(N).fill('')
    const teamPlayers = editMatchPlayers.filter((mp) => mp.team_id === tId)
    return Array.from({ length: N }, (_, i) =>
      teamPlayers[i]?.handicap_used != null ? String(teamPlayers[i].handicap_used) : ''
    )
  }

  const [teamASlots, setTeamASlots] = useState<string[]>(() =>
    initSlots(editMatch?.team_a_id ?? '')
  )
  const [teamBSlots, setTeamBSlots] = useState<string[]>(() =>
    initSlots(editMatch?.team_b_id ?? '')
  )
  const [handicapAStrs, setHandicapAStrs] = useState<string[]>(() =>
    initHandicapStrs(editMatch?.team_a_id ?? '')
  )
  const [handicapBStrs, setHandicapBStrs] = useState<string[]>(() =>
    initHandicapStrs(editMatch?.team_b_id ?? '')
  )

  // Derived slot arrays padded to length N
  const slotsA = Array.from({ length: N }, (_, i) => teamASlots[i] ?? '')
  const slotsB = Array.from({ length: N }, (_, i) => teamBSlots[i] ?? '')
  const hcpAStrs = Array.from({ length: N }, (_, i) => handicapAStrs[i] ?? '')
  const hcpBStrs = Array.from({ length: N }, (_, i) => handicapBStrs[i] ?? '')

  const eligibleAIds = useMemo(
    () => getEligiblePlayerIds(rosters, teamAId, matchDate),
    [rosters, teamAId, matchDate]
  )
  const eligibleBIds = useMemo(
    () => getEligiblePlayerIds(rosters, teamBId, matchDate),
    [rosters, teamBId, matchDate]
  )
  const eligibleAPlayers = useMemo(
    () => players.filter((p) => eligibleAIds.has(p.id)),
    [players, eligibleAIds]
  )
  const eligibleBPlayers = useMemo(
    () => players.filter((p) => eligibleBIds.has(p.id)),
    [players, eligibleBIds]
  )

  const weightsByRank = useMemo(
    () => allocationsToWeights(matchTypeAllocations),
    [matchTypeAllocations]
  )
  const allowance = selectedMatchType?.handicap_allowance ?? 1

  // Build player-for-handicap arrays using edited handicap strs
  const playersForHcpA = useMemo(() => {
    return slotsA.map((id, i) => {
      const p = players.find((pl) => pl.id === id)
      const hcp = parseNum(hcpAStrs[i])
      if (!p || hcp === null) return null
      return { id: p.id, handicap: hcp }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slotsA.join(','), hcpAStrs.join(','), players])

  const playersForHcpB = useMemo(() => {
    return slotsB.map((id, i) => {
      const p = players.find((pl) => pl.id === id)
      const hcp = parseNum(hcpBStrs[i])
      if (!p || hcp === null) return null
      return { id: p.id, handicap: hcp }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slotsB.join(','), hcpBStrs.join(','), players])

  const computedAHandicap = useMemo(() => {
    if (N === 0 || allocationsLoading) return null
    const valid = playersForHcpA.filter(
      (p): p is { id: string; handicap: number } => p !== null
    )
    if (valid.length < N) return null
    return calcTeamHandicap(valid, allowance, weightsByRank, 18).rounded
  }, [playersForHcpA, N, allowance, weightsByRank, allocationsLoading])

  const computedBHandicap = useMemo(() => {
    if (N === 0 || allocationsLoading) return null
    const valid = playersForHcpB.filter(
      (p): p is { id: string; handicap: number } => p !== null
    )
    if (valid.length < N) return null
    return calcTeamHandicap(valid, allowance, weightsByRank, 18).rounded
  }, [playersForHcpB, N, allowance, weightsByRank, allocationsLoading])

  const aGrossNum = parseIntOrNull(teamAGross)
  const bGrossNum = parseIntOrNull(teamBGross)
  const computedANet =
    aGrossNum !== null && computedAHandicap !== null ? aGrossNum - computedAHandicap : null
  const computedBNet =
    bGrossNum !== null && computedBHandicap !== null ? bGrossNum - computedBHandicap : null

  const winner: 'A' | 'B' | 'tie' | null =
    computedANet !== null && computedBNet !== null
      ? computedANet < computedBNet
        ? 'A'
        : computedBNet < computedANet
          ? 'B'
          : 'tie'
      : null

  const matchPointsNum = parseNum(matchPoints)
  const isTie = winner === 'tie'
  const teamAPoints =
    matchPointsNum !== null && winner !== null
      ? winner === 'A' || isTie
        ? matchPointsNum
        : 0
      : 0
  const teamBPoints =
    matchPointsNum !== null && winner !== null
      ? winner === 'B' || isTie
        ? matchPointsNum
        : 0
      : 0
  const playerPointsPerWinner = matchPointsNum !== null && N > 0 ? matchPointsNum / N : 0

  // ── Player slot change handlers — auto-fill handicap on selection ─────────────
  function handlePlayerAChange(i: number, playerId: string) {
    const nextSlots = [...slotsA]
    nextSlots[i] = playerId
    setTeamASlots(nextSlots)
    const nextHcp = [...hcpAStrs]
    const p = players.find((pl) => pl.id === playerId)
    nextHcp[i] = p ? String(p.handicap) : ''
    setHandicapAStrs(nextHcp)
  }

  function handlePlayerBChange(i: number, playerId: string) {
    const nextSlots = [...slotsB]
    nextSlots[i] = playerId
    setTeamBSlots(nextSlots)
    const nextHcp = [...hcpBStrs]
    const p = players.find((pl) => pl.id === playerId)
    nextHcp[i] = p ? String(p.handicap) : ''
    setHandicapBStrs(nextHcp)
  }

  // Reset all handicap inputs to current player defaults
  function resetHandicaps() {
    setHandicapAStrs(
      slotsA.map((id) => {
        const p = players.find((pl) => pl.id === id)
        return p ? String(p.handicap) : ''
      })
    )
    setHandicapBStrs(
      slotsB.map((id) => {
        const p = players.find((pl) => pl.id === id)
        return p ? String(p.handicap) : ''
      })
    )
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!matchDate) return setError('Match date is required.')
    if (!matchTypeId) return setError('Match type is required.')
    if (allocationsLoading) return setError('Loading match type weights — please wait.')
    if (!teamAId || !teamBId) return setError('Both teams are required.')
    if (teamAId === teamBId) return setError('Teams must be different.')
    if (slotsA.filter((id) => id !== '').length < N)
      return setError(`Select ${N} player(s) for Team A.`)
    if (slotsB.filter((id) => id !== '').length < N)
      return setError(`Select ${N} player(s) for Team B.`)

    // Validate handicap inputs for all filled slots
    for (let i = 0; i < N; i++) {
      if (!slotsA[i]) continue
      const hA = parseNum(hcpAStrs[i])
      if (hA === null) return setError(`Team A player ${i + 1} handicap is required.`)
      if (hA < -10 || hA > 54)
        return setError(`Team A player ${i + 1} handicap must be between -10 and 54.`)
    }
    for (let i = 0; i < N; i++) {
      if (!slotsB[i]) continue
      const hB = parseNum(hcpBStrs[i])
      if (hB === null) return setError(`Team B player ${i + 1} handicap is required.`)
      if (hB < -10 || hB > 54)
        return setError(`Team B player ${i + 1} handicap must be between -10 and 54.`)
    }

    const aWins = winner === 'A'
    const bWins = winner === 'B'

    const input: MidseasonMatchInput = {
      tournament_id: tournamentId,
      season_id: seasonId,
      match_date: matchDate,
      holes: 18,
      match_type_id: matchTypeId,
      team_a_id: teamAId,
      team_b_id: teamBId,
      team_a_handicap: computedAHandicap,
      team_b_handicap: computedBHandicap,
      team_a_gross: aGrossNum,
      team_b_gross: bGrossNum,
      team_a_net: computedANet,
      team_b_net: computedBNet,
      team_a_points: teamAPoints,
      team_b_points: teamBPoints,
      match_points: matchPointsNum,
      notes: null,
      team_a_players: slotsA
        .map((id, i) => ({ id, hcpStr: hcpAStrs[i] ?? '' }))
        .filter(({ id }) => id !== '')
        .map(({ id, hcpStr }) => ({
          player_id: id,
          handicap_used: parseNum(hcpStr) ?? null,
          points_earned: aWins ? playerPointsPerWinner : 0,
        })),
      team_b_players: slotsB
        .map((id, i) => ({ id, hcpStr: hcpBStrs[i] ?? '' }))
        .filter(({ id }) => id !== '')
        .map(({ id, hcpStr }) => ({
          player_id: id,
          handicap_used: parseNum(hcpStr) ?? null,
          points_earned: bWins ? playerPointsPerWinner : 0,
        })),
    }

    startTransition(async () => {
      const result = isEdit
        ? await updateMidseasonMatchAction(editMatch!.id, input)
        : await createMidseasonMatchAction(input)
      if ('error' in result) setError(result.error)
      else onSuccess()
    })
  }

  const inputCls =
    'w-full bg-gray-800 border border-white/20 rounded px-3 py-2 text-sm text-white'
  const readonlyCls =
    'w-full bg-gray-900 border border-white/10 rounded px-3 py-2 text-sm text-gray-400'
  const labelCls = 'block text-xs text-gray-400 mb-1'
  const hcpInputCls =
    'w-20 shrink-0 bg-gray-800 border border-white/20 rounded px-2 py-2 text-sm text-white'

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <p className="text-red-400 text-sm">{error}</p>}

      {/* Match Type + Date */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Match Type *</label>
          <select
            className={inputCls}
            value={matchTypeId}
            onChange={(e) => {
              setMatchTypeId(e.target.value)
              setTeamASlots([])
              setTeamBSlots([])
              setHandicapAStrs([])
              setHandicapBStrs([])
            }}
            required
          >
            <option value="">— select —</option>
            {matchTypes.map((mt) => (
              <option key={mt.id} value={mt.id}>
                {mt.name} ({mt.players_per_team}v{mt.players_per_team})
              </option>
            ))}
          </select>
          {allocationsLoading && (
            <p className="text-xs text-yellow-400 mt-1">Loading weights…</p>
          )}
        </div>
        <div>
          <label className={labelCls}>Match Date *</label>
          <input
            type="date"
            className={inputCls}
            value={matchDate}
            onChange={(e) => setMatchDate(e.target.value)}
            required
          />
        </div>
      </div>

      {/* Teams */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Team A *</label>
          <select
            className={inputCls}
            value={teamAId}
            onChange={(e) => {
              setTeamAId(e.target.value)
              setTeamASlots([])
              setHandicapAStrs([])
            }}
            required
          >
            <option value="">— select —</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelCls}>Team B *</label>
          <select
            className={inputCls}
            value={teamBId}
            onChange={(e) => {
              setTeamBId(e.target.value)
              setTeamBSlots([])
              setHandicapBStrs([])
            }}
            required
          >
            <option value="">— select —</option>
            {teams
              .filter((t) => t.id !== teamAId)
              .map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
          </select>
        </div>
      </div>

      {/* Player slots with editable handicaps */}
      {N > 0 && (
        <div>
          <div className="grid grid-cols-2 gap-3">
            {/* Team A */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-gray-300">Team A Players</p>
              {slotsA.map((playerId, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <select
                    className="flex-1 bg-gray-800 border border-white/20 rounded px-3 py-2 text-sm text-white"
                    value={playerId}
                    onChange={(e) => handlePlayerAChange(i, e.target.value)}
                  >
                    <option value="">— player {i + 1} —</option>
                    {eligibleAPlayers.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.full_name} (hcp {p.handicap})
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    step="any"
                    min={-10}
                    max={54}
                    className={hcpInputCls}
                    value={hcpAStrs[i]}
                    onChange={(e) => {
                      const next = [...hcpAStrs]
                      next[i] = e.target.value
                      setHandicapAStrs(next)
                    }}
                    placeholder="hcp"
                    aria-label={`Team A player ${i + 1} handicap`}
                  />
                </div>
              ))}
              {eligibleAPlayers.length === 0 && matchDate && teamAId && (
                <p className="text-xs text-yellow-400">No eligible players for this date.</p>
              )}
              {computedAHandicap !== null && (
                <p className="text-xs text-green-400">Team handicap: {computedAHandicap}</p>
              )}
            </div>

            {/* Team B */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-gray-300">Team B Players</p>
              {slotsB.map((playerId, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <select
                    className="flex-1 bg-gray-800 border border-white/20 rounded px-3 py-2 text-sm text-white"
                    value={playerId}
                    onChange={(e) => handlePlayerBChange(i, e.target.value)}
                  >
                    <option value="">— player {i + 1} —</option>
                    {eligibleBPlayers.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.full_name} (hcp {p.handicap})
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    step="any"
                    min={-10}
                    max={54}
                    className={hcpInputCls}
                    value={hcpBStrs[i]}
                    onChange={(e) => {
                      const next = [...hcpBStrs]
                      next[i] = e.target.value
                      setHandicapBStrs(next)
                    }}
                    placeholder="hcp"
                    aria-label={`Team B player ${i + 1} handicap`}
                  />
                </div>
              ))}
              {eligibleBPlayers.length === 0 && matchDate && teamBId && (
                <p className="text-xs text-yellow-400">No eligible players for this date.</p>
              )}
              {computedBHandicap !== null && (
                <p className="text-xs text-green-400">Team handicap: {computedBHandicap}</p>
              )}
            </div>
          </div>

          {/* Reset button */}
          <button
            type="button"
            onClick={resetHandicaps}
            className="mt-2 text-xs text-gray-400 hover:text-white underline"
          >
            Reset handicaps to defaults
          </button>
        </div>
      )}

      {/* Scores */}
      <div>
        <p className="text-xs font-medium text-gray-300 mb-2">Scores</p>
        <div className="grid grid-cols-4 gap-2">
          <div>
            <label className={labelCls}>A Gross</label>
            <input
              type="number"
              className={inputCls}
              value={teamAGross}
              onChange={(e) => setTeamAGross(e.target.value)}
            />
          </div>
          <div>
            <label className={labelCls}>B Gross</label>
            <input
              type="number"
              className={inputCls}
              value={teamBGross}
              onChange={(e) => setTeamBGross(e.target.value)}
            />
          </div>
          <div>
            <label className={labelCls}>A Net</label>
            <div className={readonlyCls}>
              {computedANet !== null ? computedANet : <span className="opacity-40">—</span>}
            </div>
          </div>
          <div>
            <label className={labelCls}>B Net</label>
            <div className={readonlyCls}>
              {computedBNet !== null ? computedBNet : <span className="opacity-40">—</span>}
            </div>
          </div>
        </div>

        {/* Winner indicator */}
        {winner && (
          <p className="mt-2 text-xs font-medium">
            {winner === 'tie' ? (
              <span className="text-yellow-400">Tie</span>
            ) : (
              <span className="text-green-400">
                {winner === 'A'
                  ? teams.find((t) => t.id === teamAId)?.name ?? 'Team A'
                  : teams.find((t) => t.id === teamBId)?.name ?? 'Team B'}{' '}
                wins
              </span>
            )}
          </p>
        )}
      </div>

      {/* Match Points */}
      <div>
        <label className={labelCls}>Match Points</label>
        <input
          type="number"
          step="any"
          className={inputCls}
          value={matchPoints}
          onChange={(e) => setMatchPoints(e.target.value)}
          placeholder="e.g. 4"
        />
        {matchPointsNum !== null && winner !== null && (
          <div className="mt-1.5 text-xs text-gray-400 space-y-0.5">
            <p>
              Team A: <span className="text-white">{teamAPoints}</span> pts &nbsp;|&nbsp; Team B:{' '}
              <span className="text-white">{teamBPoints}</span> pts
            </p>
            {!isTie && N > 0 && (
              <p>
                Per winning player:{' '}
                <span className="text-white">{playerPointsPerWinner.toFixed(2)}</span> pts
              </p>
            )}
            {isTie && <p className="text-yellow-400">Tie — players earn 0 pts each.</p>}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-1">
        <button
          type="submit"
          disabled={isPending || allocationsLoading}
          className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium py-2 rounded"
        >
          {allocationsLoading
            ? 'Loading weights…'
            : isPending
              ? 'Saving…'
              : isEdit
                ? 'Save Changes'
                : 'Add Match'}
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
