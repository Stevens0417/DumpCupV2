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
import { calcTeamHandicap, adjustHandicapForHoles } from '@/lib/domain/handicaps/calcTeamHandicap'
import { computeMatchPoints, computePlayerPoints } from '@/lib/domain/handicaps/matchCalc'
import {
  createMatchAction,
  updateMatchAction,
  getMatchTypeAllocationsAction,
  type MatchActionInput,
} from './actions'

type Props = {
  seasonId: string
  matchTypes: MatchType[]
  teams: Team[]
  players: Player[]
  rosters: Roster[]
  allAllocations: MatchTypeAllocation[]
  editMatch?: Match
  editMatchPlayers?: MatchPlayer[]
  onSuccess: () => void
  onCancel: () => void
}

function parseNullableInt(val: string): number | null {
  const n = parseInt(val, 10)
  return isNaN(n) ? null : n
}

function parseNullableFloat(val: string): number | null {
  const n = parseFloat(val)
  return isNaN(n) ? null : n
}

function getEligiblePlayerIds(
  rosters: Roster[],
  teamId: string,
  matchDate: string
): Set<string> {
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

function allocationsToWeights(allocations: MatchTypeAllocation[]): Record<number, number> {
  if (allocations.length === 0) return { 1: 1 } // singles default
  return Object.fromEntries(allocations.map((a) => [a.rank_order, a.percentage_weight]))
}

export default function MatchForm({
  seasonId,
  matchTypes,
  teams,
  players,
  rosters,
  allAllocations,
  editMatch,
  editMatchPlayers,
  onSuccess,
  onCancel,
}: Props) {
  const isEdit = !!editMatch

  // --- Form state ---
  const [matchDate, setMatchDate] = useState(editMatch?.match_date ?? '')
  const [holes, setHoles] = useState(String(editMatch?.holes ?? 18))
  const [matchTypeId, setMatchTypeId] = useState(editMatch?.match_type_id ?? '')
  const [teamAId, setTeamAId] = useState(editMatch?.team_a_id ?? '')
  const [teamBId, setTeamBId] = useState(editMatch?.team_b_id ?? '')
  const [tournamentId, setTournamentId] = useState(editMatch?.tournament_id ?? '')
  const [notes, setNotes] = useState(editMatch?.notes ?? '')

  const [teamAGross, setTeamAGross] = useState(
    editMatch?.team_a_gross != null ? String(editMatch.team_a_gross) : ''
  )
  const [teamBGross, setTeamBGross] = useState(
    editMatch?.team_b_gross != null ? String(editMatch.team_b_gross) : ''
  )
  const [teamAHcapOverride, setTeamAHcapOverride] = useState(
    editMatch?.team_a_handicap != null ? String(editMatch.team_a_handicap) : ''
  )
  const [teamBHcapOverride, setTeamBHcapOverride] = useState(
    editMatch?.team_b_handicap != null ? String(editMatch.team_b_handicap) : ''
  )
  const [teamAPointsOverride, setTeamAPointsOverride] = useState('')
  const [teamBPointsOverride, setTeamBPointsOverride] = useState('')
  const [playerAPointOverrides, setPlayerAPointOverrides] = useState<string[]>([])
  const [playerBPointOverrides, setPlayerBPointOverrides] = useState<string[]>([])

  // --- Part A: Allocations fetched fresh per match type (never stale) ---
  const [matchTypeAllocations, setMatchTypeAllocations] = useState<MatchTypeAllocation[]>(
    () => allAllocations.filter((a) => a.match_type_id === (editMatch?.match_type_id ?? ''))
  )
  const [allocationsLoading, setAllocationsLoading] = useState(false)
  const loadedForRef = useRef(editMatch?.match_type_id ?? '')

  useEffect(() => {
    if (!matchTypeId || matchTypeId === loadedForRef.current) return
    loadedForRef.current = matchTypeId
    setAllocationsLoading(true)
    setMatchTypeAllocations([]) // clear stale weights immediately
    getMatchTypeAllocationsAction(matchTypeId).then((result) => {
      setMatchTypeAllocations('data' in result ? result.data : [])
      setAllocationsLoading(false)
    })
  }, [matchTypeId])

  // --- Part B: Default to Dresden / York teams (add mode only) ---
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

  // --- Derived ---
  const selectedMatchType = useMemo(
    () => matchTypes.find((mt) => mt.id === matchTypeId) ?? null,
    [matchTypes, matchTypeId]
  )
  const N = selectedMatchType?.players_per_team ?? 0

  const initSlots = (tId: string): string[] => {
    if (!isEdit || !editMatchPlayers) return Array(N).fill('')
    const teamPlayers = editMatchPlayers.filter((mp) => mp.team_id === tId)
    return Array.from({ length: N }, (_, i) => teamPlayers[i]?.player_id ?? '')
  }

  const [teamASlots, setTeamASlots] = useState<string[]>(() =>
    initSlots(editMatch?.team_a_id ?? '')
  )
  const [teamBSlots, setTeamBSlots] = useState<string[]>(() =>
    initSlots(editMatch?.team_b_id ?? '')
  )

  const resizedA = Array.from({ length: N }, (_, i) => teamASlots[i] ?? '')
  const resizedB = Array.from({ length: N }, (_, i) => teamBSlots[i] ?? '')
  const resizedPlayerAOverrides = Array.from(
    { length: N },
    (_, i) => playerAPointOverrides[i] ?? ''
  )
  const resizedPlayerBOverrides = Array.from(
    { length: N },
    (_, i) => playerBPointOverrides[i] ?? ''
  )

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

  const slotAKey = resizedA.join(',')
  const slotBKey = resizedB.join(',')
  const selectedAPlayers = useMemo(
    () => resizedA.map((id) => players.find((p) => p.id === id) ?? null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [slotAKey, players]
  )
  const selectedBPlayers = useMemo(
    () => resizedB.map((id) => players.find((p) => p.id === id) ?? null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [slotBKey, players]
  )

  // Weights from freshly-fetched allocations
  const weightsByRank = useMemo(
    () => allocationsToWeights(matchTypeAllocations),
    [matchTypeAllocations]
  )

  // Deterministic handicap via calcTeamHandicap (stable sort by hcp then id)
  const computedAHandicap = useMemo(() => {
    if (N === 0 || allocationsLoading) return null
    const validPlayers = selectedAPlayers
      .filter((p): p is Player => p !== null)
      .map((p) => ({ id: p.id, handicap: p.handicap }))
    if (validPlayers.length < N) return null
    const h = parseInt(holes, 10)
    return calcTeamHandicap(validPlayers, selectedMatchType?.handicap_allowance ?? 1, weightsByRank, isNaN(h) ? 18 : h)
      .rounded
  }, [selectedAPlayers, N, selectedMatchType, weightsByRank, allocationsLoading, holes])

  const computedBHandicap = useMemo(() => {
    if (N === 0 || allocationsLoading) return null
    const validPlayers = selectedBPlayers
      .filter((p): p is Player => p !== null)
      .map((p) => ({ id: p.id, handicap: p.handicap }))
    if (validPlayers.length < N) return null
    const h = parseInt(holes, 10)
    return calcTeamHandicap(validPlayers, selectedMatchType?.handicap_allowance ?? 1, weightsByRank, isNaN(h) ? 18 : h)
      .rounded
  }, [selectedBPlayers, N, selectedMatchType, weightsByRank, allocationsLoading, holes])

  const effectiveAHandicap = useMemo(
    () => (teamAHcapOverride !== '' ? parseNullableInt(teamAHcapOverride) : computedAHandicap),
    [teamAHcapOverride, computedAHandicap]
  )
  const effectiveBHandicap = useMemo(
    () => (teamBHcapOverride !== '' ? parseNullableInt(teamBHcapOverride) : computedBHandicap),
    [teamBHcapOverride, computedBHandicap]
  )

  const computedANet = useMemo(() => {
    const gross = parseNullableInt(teamAGross)
    if (gross === null || effectiveAHandicap === null) return null
    return gross - effectiveAHandicap
  }, [teamAGross, effectiveAHandicap])

  const computedBNet = useMemo(() => {
    const gross = parseNullableInt(teamBGross)
    if (gross === null || effectiveBHandicap === null) return null
    return gross - effectiveBHandicap
  }, [teamBGross, effectiveBHandicap])

  const computedPoints = useMemo(() => {
    const h = parseInt(holes, 10)
    if (isNaN(h) || N === 0) return null
    return computeMatchPoints(
      h,
      N,
      computedANet,
      computedBNet,
      parseNullableInt(teamAGross),
      parseNullableInt(teamBGross)
    )
  }, [holes, N, computedANet, computedBNet, teamAGross, teamBGross])

  const effectiveAPoints = useMemo(
    () =>
      teamAPointsOverride !== ''
        ? (parseNullableFloat(teamAPointsOverride) ?? 0)
        : (computedPoints?.teamA ?? 0),
    [teamAPointsOverride, computedPoints]
  )
  const effectiveBPoints = useMemo(
    () =>
      teamBPointsOverride !== ''
        ? (parseNullableFloat(teamBPointsOverride) ?? 0)
        : (computedPoints?.teamB ?? 0),
    [teamBPointsOverride, computedPoints]
  )

  const autoAPlayerPoints = useMemo(() => {
    if (!computedPoints || computedPoints.isTie || computedPoints.teamA === 0) return 0
    return computedPoints.basePoints
  }, [computedPoints])

  const autoBPlayerPoints = useMemo(() => {
    if (!computedPoints || computedPoints.isTie || computedPoints.teamB === 0) return 0
    return computedPoints.basePoints
  }, [computedPoints])

  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function setSlotA(i: number, val: string) {
    const next = [...resizedA]; next[i] = val; setTeamASlots(next)
  }
  function setSlotB(i: number, val: string) {
    const next = [...resizedB]; next[i] = val; setTeamBSlots(next)
  }
  function setPlayerAOverride(i: number, val: string) {
    const next = [...resizedPlayerAOverrides]; next[i] = val; setPlayerAPointOverrides(next)
  }
  function setPlayerBOverride(i: number, val: string) {
    const next = [...resizedPlayerBOverrides]; next[i] = val; setPlayerBPointOverrides(next)
  }
  function clearSlots() {
    setTeamASlots([]); setTeamBSlots([])
    setPlayerAPointOverrides([]); setPlayerBPointOverrides([])
  }
  function recalcPlayerPointsA() {
    const per = N > 0 ? effectiveAPoints / N : 0
    setPlayerAPointOverrides(Array(N).fill(per.toFixed(2)))
  }
  function recalcPlayerPointsB() {
    const per = N > 0 ? effectiveBPoints / N : 0
    setPlayerBPointOverrides(Array(N).fill(per.toFixed(2)))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!matchDate) return setError('Match date is required.')
    if (!matchTypeId) return setError('Match type is required.')
    if (allocationsLoading) return setError('Match type weights still loading. Please wait.')
    if (!teamAId || !teamBId) return setError('Both teams are required.')
    if (teamAId === teamBId) return setError('Teams must be different.')

    const holesNum = parseInt(holes, 10)
    if (isNaN(holesNum) || holesNum < 1) return setError('Holes must be at least 1.')

    const isTie = computedPoints?.isTie ?? false

    // Part C: always persist match_players.points_earned
    const buildPlayers = (
      slots: string[],
      selectedPls: (Player | null)[],
      pointOverrides: string[],
      autoPoints: number
    ) =>
      slots
        .map((id, i) => ({
          player_id: id,
          handicap_used: selectedPls[i]
            ? adjustHandicapForHoles(selectedPls[i]!.handicap, holesNum)
            : null,
          points_earned: id
            ? pointOverrides[i] != null && pointOverrides[i] !== ''
              ? parseFloat(pointOverrides[i]) || 0
              : computePlayerPoints(autoPoints, false)
            : 0,
        }))
        .filter((p) => p.player_id !== '')

    const input: MatchActionInput = {
      season_id: seasonId,
      match_date: matchDate,
      holes: holesNum,
      match_type_id: matchTypeId,
      team_a_id: teamAId,
      team_b_id: teamBId,
      team_a_handicap: effectiveAHandicap ?? null,
      team_b_handicap: effectiveBHandicap ?? null,
      team_a_gross: parseNullableInt(teamAGross),
      team_b_gross: parseNullableInt(teamBGross),
      team_a_net: computedANet,
      team_b_net: computedBNet,
      team_a_points: effectiveAPoints,
      team_b_points: effectiveBPoints,
      tournament_id: tournamentId || null,
      notes: notes.trim() || null,
      team_a_players: buildPlayers(
        resizedA, selectedAPlayers, resizedPlayerAOverrides, isTie ? 0 : autoAPlayerPoints
      ),
      team_b_players: buildPlayers(
        resizedB, selectedBPlayers, resizedPlayerBOverrides, isTie ? 0 : autoBPlayerPoints
      ),
    }

    startTransition(async () => {
      const result = isEdit
        ? await updateMatchAction(editMatch!.id, input)
        : await createMatchAction(input)
      if ('error' in result) {
        setError(result.error)
      } else {
        onSuccess()
      }
    })
  }

  const inputCls = 'w-full bg-gray-800 border border-white/20 rounded px-3 py-2 text-sm text-white'
  const readonlyCls = 'w-full bg-gray-900 border border-white/10 rounded px-3 py-2 text-sm text-gray-400 cursor-default'
  const labelCls = 'block text-xs text-gray-400 mb-1'
  const isBlocked = isPending || allocationsLoading

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <p className="text-red-400 text-sm">{error}</p>}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Match Date *</label>
          <input type="date" className={inputCls} value={matchDate}
            onChange={(e) => setMatchDate(e.target.value)} required />
        </div>
        <div>
          <label className={labelCls}>Holes *</label>
          <input type="number" className={inputCls} value={holes} min={1}
            onChange={(e) => setHoles(e.target.value)} required />
        </div>
      </div>

      <div>
        <label className={labelCls}>Match Type *</label>
        <select className={inputCls} value={matchTypeId}
          onChange={(e) => { setMatchTypeId(e.target.value); clearSlots() }} required>
          <option value="">— select —</option>
          {matchTypes.map((mt) => (
            <option key={mt.id} value={mt.id}>
              {mt.name} ({mt.players_per_team}v{mt.players_per_team})
            </option>
          ))}
        </select>
        {allocationsLoading && (
          <p className="text-xs text-yellow-400 mt-1">Loading match type weights…</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Team A *</label>
          <select className={inputCls} value={teamAId}
            onChange={(e) => { setTeamAId(e.target.value); setTeamASlots([]); setPlayerAPointOverrides([]) }}
            required>
            <option value="">— select —</option>
            {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>
        <div>
          <label className={labelCls}>Team B *</label>
          <select className={inputCls} value={teamBId}
            onChange={(e) => { setTeamBId(e.target.value); setTeamBSlots([]); setPlayerBPointOverrides([]) }}
            required>
            <option value="">— select —</option>
            {teams.filter((t) => t.id !== teamAId).map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>
      </div>

      {N > 0 && (
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <p className="text-xs font-medium text-gray-300">Team A Players</p>
            {resizedA.map((playerId, i) => (
              <select key={i} className={inputCls} value={playerId}
                onChange={(e) => setSlotA(i, e.target.value)}>
                <option value="">— player {i + 1} —</option>
                {eligibleAPlayers.map((p) => (
                  <option key={p.id} value={p.id}>{p.full_name} (hcp {p.handicap})</option>
                ))}
              </select>
            ))}
            {eligibleAPlayers.length === 0 && matchDate && teamAId && (
              <p className="text-xs text-yellow-400">No eligible players for this date.</p>
            )}
          </div>
          <div className="space-y-2">
            <p className="text-xs font-medium text-gray-300">Team B Players</p>
            {resizedB.map((playerId, i) => (
              <select key={i} className={inputCls} value={playerId}
                onChange={(e) => setSlotB(i, e.target.value)}>
                <option value="">— player {i + 1} —</option>
                {eligibleBPlayers.map((p) => (
                  <option key={p.id} value={p.id}>{p.full_name} (hcp {p.handicap})</option>
                ))}
              </select>
            ))}
            {eligibleBPlayers.length === 0 && matchDate && teamBId && (
              <p className="text-xs text-yellow-400">No eligible players for this date.</p>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>
            Team A Handicap
            {computedAHandicap !== null && teamAHcapOverride === '' && (
              <span className="ml-1 text-green-400">(auto: {computedAHandicap})</span>
            )}
          </label>
          <input type="number" className={inputCls}
            placeholder={computedAHandicap !== null ? String(computedAHandicap) : 'override'}
            value={teamAHcapOverride} onChange={(e) => setTeamAHcapOverride(e.target.value)} />
          {teamAHcapOverride !== '' && (
            <button type="button" className="text-xs text-gray-400 mt-1 hover:text-white"
              onClick={() => setTeamAHcapOverride('')}>Reset to auto</button>
          )}
        </div>
        <div>
          <label className={labelCls}>
            Team B Handicap
            {computedBHandicap !== null && teamBHcapOverride === '' && (
              <span className="ml-1 text-green-400">(auto: {computedBHandicap})</span>
            )}
          </label>
          <input type="number" className={inputCls}
            placeholder={computedBHandicap !== null ? String(computedBHandicap) : 'override'}
            value={teamBHcapOverride} onChange={(e) => setTeamBHcapOverride(e.target.value)} />
          {teamBHcapOverride !== '' && (
            <button type="button" className="text-xs text-gray-400 mt-1 hover:text-white"
              onClick={() => setTeamBHcapOverride('')}>Reset to auto</button>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-medium text-gray-300">Scores (optional)</p>
        <div className="grid grid-cols-4 gap-2">
          <div>
            <label className={labelCls}>A Gross</label>
            <input type="number" className={inputCls} value={teamAGross}
              onChange={(e) => setTeamAGross(e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>B Gross</label>
            <input type="number" className={inputCls} value={teamBGross}
              onChange={(e) => setTeamBGross(e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>A Net <span className="text-gray-500">(auto)</span></label>
            <div className={readonlyCls}>
              {computedANet !== null ? computedANet : <span className="opacity-40">—</span>}
            </div>
          </div>
          <div>
            <label className={labelCls}>B Net <span className="text-gray-500">(auto)</span></label>
            <div className={readonlyCls}>
              {computedBNet !== null ? computedBNet : <span className="opacity-40">—</span>}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>
            Team A Points
            {computedPoints && teamAPointsOverride === '' && (
              <span className="ml-1 text-green-400">(auto: {computedPoints.teamA.toFixed(2)})</span>
            )}
          </label>
          <input type="number" step="0.01" className={inputCls}
            placeholder={computedPoints ? String(computedPoints.teamA) : 'override'}
            value={teamAPointsOverride} onChange={(e) => setTeamAPointsOverride(e.target.value)} />
          {teamAPointsOverride !== '' && (
            <div className="flex gap-2 mt-1">
              <button type="button" className="text-xs text-gray-400 hover:text-white"
                onClick={() => setTeamAPointsOverride('')}>Reset to auto</button>
              <button type="button" className="text-xs text-blue-400 hover:text-blue-300"
                onClick={recalcPlayerPointsA}>Recalculate player pts</button>
            </div>
          )}
        </div>
        <div>
          <label className={labelCls}>
            Team B Points
            {computedPoints && teamBPointsOverride === '' && (
              <span className="ml-1 text-green-400">(auto: {computedPoints.teamB.toFixed(2)})</span>
            )}
          </label>
          <input type="number" step="0.01" className={inputCls}
            placeholder={computedPoints ? String(computedPoints.teamB) : 'override'}
            value={teamBPointsOverride} onChange={(e) => setTeamBPointsOverride(e.target.value)} />
          {teamBPointsOverride !== '' && (
            <div className="flex gap-2 mt-1">
              <button type="button" className="text-xs text-gray-400 hover:text-white"
                onClick={() => setTeamBPointsOverride('')}>Reset to auto</button>
              <button type="button" className="text-xs text-blue-400 hover:text-blue-300"
                onClick={recalcPlayerPointsB}>Recalculate player pts</button>
            </div>
          )}
        </div>
      </div>

      {N > 0 && (teamAId || teamBId) && (
        <div className="space-y-3">
          <p className="text-xs font-medium text-gray-300">Per-Player Points (optional overrides)</p>
          {teamAId && resizedA.some((id) => id !== '') && (
            <div className="space-y-1">
              <p className="text-xs text-gray-400">Team A</p>
              {resizedA.map((playerId, i) => {
                if (!playerId) return null
                const p = players.find((pl) => pl.id === playerId)
                const override = resizedPlayerAOverrides[i]
                return (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-xs text-gray-300 flex-1 truncate">{p?.full_name ?? '?'}</span>
                    {override === '' && (
                      <span className="text-xs text-green-400 shrink-0">
                        auto: {autoAPlayerPoints.toFixed(2)}
                      </span>
                    )}
                    <input type="number" step="0.01"
                      className="w-20 bg-gray-700 border border-white/20 rounded px-2 py-1 text-xs text-white"
                      placeholder={String(autoAPlayerPoints)} value={override}
                      onChange={(e) => setPlayerAOverride(i, e.target.value)} />
                    {override !== '' && (
                      <button type="button" className="text-xs text-gray-400 hover:text-white shrink-0"
                        onClick={() => setPlayerAOverride(i, '')}>Reset</button>
                    )}
                  </div>
                )
              })}
            </div>
          )}
          {teamBId && resizedB.some((id) => id !== '') && (
            <div className="space-y-1">
              <p className="text-xs text-gray-400">Team B</p>
              {resizedB.map((playerId, i) => {
                if (!playerId) return null
                const p = players.find((pl) => pl.id === playerId)
                const override = resizedPlayerBOverrides[i]
                return (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-xs text-gray-300 flex-1 truncate">{p?.full_name ?? '?'}</span>
                    {override === '' && (
                      <span className="text-xs text-green-400 shrink-0">
                        auto: {autoBPlayerPoints.toFixed(2)}
                      </span>
                    )}
                    <input type="number" step="0.01"
                      className="w-20 bg-gray-700 border border-white/20 rounded px-2 py-1 text-xs text-white"
                      placeholder={String(autoBPlayerPoints)} value={override}
                      onChange={(e) => setPlayerBOverride(i, e.target.value)} />
                    {override !== '' && (
                      <button type="button" className="text-xs text-gray-400 hover:text-white shrink-0"
                        onClick={() => setPlayerBOverride(i, '')}>Reset</button>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      <div>
        <label className={labelCls}>Notes</label>
        <textarea className={inputCls} rows={2} value={notes}
          onChange={(e) => setNotes(e.target.value)} />
      </div>

      <div className="flex gap-3">
        <button type="submit" disabled={isBlocked}
          className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium py-2 rounded">
          {allocationsLoading ? 'Loading weights…' : isPending ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Match'}
        </button>
        <button type="button" onClick={onCancel}
          className="px-4 py-2 text-sm text-gray-400 hover:text-white border border-white/20 rounded">
          Cancel
        </button>
      </div>
    </form>
  )
}
