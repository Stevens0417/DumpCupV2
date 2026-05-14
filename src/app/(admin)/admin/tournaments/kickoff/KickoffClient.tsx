'use client'

import { useState, useMemo, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type {
  Tournament,
  TournamentEntry,
  TournamentPositionPoints,
  Season,
  Team,
} from '@/types/database'
import type { PlayerWithTeam } from '@/lib/db/tournamentUtils'
import { saveKickoffSetupAction, saveAllTournamentEntriesAction } from '../actions'

type KickoffMode = 'setup' | 'results'

type Props = {
  seasons: Season[]
  selectedSeasonId: string
  tournament: Tournament
  playersWithTeams: PlayerWithTeam[]
  teams: Team[]
  initialEntries: TournamentEntry[]
  initialPositionPoints: TournamentPositionPoints[]
}

type PlayerRow = { player_id: string; handicap_used: string }
type SetupPointsRow = { finish_position: number; points: string }

type DisplayRow = {
  player_id: string
  player_name: string
  team_id: string | null
  handicap: number
  gross: string
  net: number | null
  auto_position: number | null
  finish_position: number | null
  finish_position_str: string
  is_override: boolean
  points_awarded: number | null
  missing_points: boolean
}

function ordinal(n: number): string {
  const s = n === 1 ? 'st' : n === 2 ? 'nd' : n === 3 ? 'rd' : 'th'
  return `${n}${s}`
}

export default function KickoffClient({
  seasons,
  selectedSeasonId,
  tournament,
  playersWithTeams,
  teams,
  initialEntries,
  initialPositionPoints,
}: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [savedAt, setSavedAt] = useState<Date | null>(null)

  const [mode, setMode] = useState<KickoffMode>(
    tournament.status === 'setup' ? 'setup' : 'results',
  )

  // ── SETUP STATE ─────────────────────────────────────────────────────────────

  const [date, setDate] = useState(tournament.tournament_date ?? '')
  const [course, setCourse] = useState(tournament.course ?? '')
  const [posterUrl, setPosterUrl] = useState(tournament.poster_url ?? '')
  const [setupError, setSetupError] = useState<string | null>(null)

  const initialCount = Math.max(initialEntries.length, 2)
  const [playerCount, setPlayerCount] = useState<number>(initialCount)
  const [playerRows, setPlayerRows] = useState<PlayerRow[]>(() => {
    if (initialEntries.length > 0) {
      return initialEntries.map((e) => ({
        player_id: e.player_id,
        handicap_used: e.handicap_used != null ? String(e.handicap_used) : '',
      }))
    }
    return Array.from({ length: 2 }, () => ({ player_id: '', handicap_used: '' }))
  })
  const [positionPointsRows, setPositionPointsRows] = useState<SetupPointsRow[]>(() => {
    if (initialPositionPoints.length > 0) {
      return initialPositionPoints.map((pp) => ({
        finish_position: pp.finish_position,
        points: String(pp.points),
      }))
    }
    return Array.from({ length: initialCount }, (_, i) => ({ finish_position: i + 1, points: '' }))
  })

  function handlePlayerCountChange(raw: string) {
    const n = Math.max(1, Math.min(50, parseInt(raw) || 1))
    setPlayerCount(n)
    setPlayerRows((prev) =>
      n > prev.length
        ? [...prev, ...Array.from({ length: n - prev.length }, () => ({ player_id: '', handicap_used: '' }))]
        : prev.slice(0, n),
    )
    setPositionPointsRows((prev) =>
      n > prev.length
        ? [...prev, ...Array.from({ length: n - prev.length }, (_, i) => ({ finish_position: prev.length + i + 1, points: '' }))]
        : prev.slice(0, n),
    )
  }

  function handlePlayerSelect(i: number, playerId: string) {
    setPlayerRows((prev) => {
      const next = [...prev]
      const player = playersWithTeams.find((p) => p.id === playerId)
      next[i] = { player_id: playerId, handicap_used: player ? String(player.handicap) : '' }
      return next
    })
  }

  function validateSetup(): string | null {
    if (!date) return 'Tournament date is required.'
    const filledIds = playerRows.map((r) => r.player_id).filter(Boolean)
    if (filledIds.length < playerCount) return 'All player slots must be filled.'
    if (new Set(filledIds).size < filledIds.length) return 'Duplicate players are not allowed.'
    for (let i = 0; i < playerRows.length; i++) {
      const hcp = playerRows[i].handicap_used
      if (hcp === '' || isNaN(parseFloat(hcp))) return `Player ${i + 1} is missing a handicap.`
    }
    for (const pp of positionPointsRows) {
      if (pp.points === '' || isNaN(parseFloat(pp.points))) {
        return `${ordinal(pp.finish_position)} place is missing a points value.`
      }
    }
    return null
  }

  function handleSaveSetup() {
    const err = validateSetup()
    if (err) {
      setSetupError(err)
      return
    }
    setSetupError(null)

    const players = playerRows.map((row) => ({
      player_id: row.player_id,
      team_id: playersWithTeams.find((p) => p.id === row.player_id)?.team_id ?? null,
      handicap_used: parseFloat(row.handicap_used),
    }))
    const points = positionPointsRows.map((pp) => ({
      finish_position: pp.finish_position,
      points: parseFloat(pp.points),
    }))

    startTransition(async () => {
      const result = await saveKickoffSetupAction(
        tournament.id,
        { tournament_date: date, course: course || null, poster_url: posterUrl || null },
        players,
        points,
      )
      if ('error' in result) {
        setSetupError(result.error)
      } else {
        setSavedAt(new Date())
        router.refresh()
      }
    })
  }

  // ── RESULTS STATE ────────────────────────────────────────────────────────────

  // gross scores keyed by player_id
  const [grossMap, setGrossMap] = useState<Map<string, string>>(() => {
    const map = new Map<string, string>()
    for (const e of initialEntries) {
      if (e.gross_score != null) map.set(e.player_id, String(e.gross_score))
    }
    return map
  })

  // manual finish position overrides keyed by player_id
  const [positionOverrides, setPositionOverrides] = useState<Map<string, string>>(new Map())

  const [resultsError, setResultsError] = useState<string | null>(null)
  const [resultsDirty, setResultsDirty] = useState(false)

  // position → points lookup
  const pointsForPosition = useMemo(
    () => new Map(initialPositionPoints.map((pp) => [pp.finish_position, Number(pp.points)])),
    [initialPositionPoints],
  )

  const displayRows = useMemo((): DisplayRow[] => {
    // Build base with net scores
    const base = initialEntries.map((entry) => {
      const player = playersWithTeams.find((p) => p.id === entry.player_id)
      const gross = grossMap.get(entry.player_id) ?? ''
      const handicap = Number(entry.handicap_used ?? player?.handicap ?? 0)
      const grossNum = gross !== '' ? parseFloat(gross) : null
      const net =
        grossNum !== null && !isNaN(grossNum) ? Math.round(grossNum - handicap) : null
      return {
        player_id: entry.player_id,
        player_name: player?.full_name ?? '—',
        team_id: entry.team_id,
        handicap,
        gross,
        net,
      }
    })

    // Sort: net ASC (nulls last), then name ASC
    base.sort((a, b) => {
      if (a.net === null && b.net === null) return a.player_name.localeCompare(b.player_name)
      if (a.net === null) return 1
      if (b.net === null) return -1
      if (a.net !== b.net) return a.net - b.net
      return a.player_name.localeCompare(b.player_name)
    })

    // Auto-assign positions (ties share the same position)
    const autoPos = new Map<string, number>()
    let pos = 1
    for (let i = 0; i < base.length; i++) {
      if (base[i].net === null) continue
      if (i > 0 && base[i].net === base[i - 1].net && autoPos.has(base[i - 1].player_id)) {
        autoPos.set(base[i].player_id, autoPos.get(base[i - 1].player_id)!)
        pos++
      } else {
        autoPos.set(base[i].player_id, pos++)
      }
    }

    // Apply overrides and look up points
    return base.map((row) => {
      const autoPosVal = autoPos.get(row.player_id) ?? null
      const overrideStr = positionOverrides.get(row.player_id)
      const isOverride = overrideStr !== undefined && overrideStr !== ''
      const finishPos = isOverride ? (parseInt(overrideStr) || null) : autoPosVal
      const finishPosStr = isOverride
        ? overrideStr
        : autoPosVal !== null
          ? String(autoPosVal)
          : ''
      const pointsAwarded =
        finishPos !== null ? (pointsForPosition.get(finishPos) ?? null) : null
      const missingPoints = finishPos !== null && pointsAwarded === null

      return {
        ...row,
        auto_position: autoPosVal,
        finish_position: finishPos,
        finish_position_str: finishPosStr,
        is_override: isOverride,
        points_awarded: pointsAwarded,
        missing_points: missingPoints,
      }
    })
  }, [initialEntries, playersWithTeams, grossMap, positionOverrides, pointsForPosition])

  function setGross(playerId: string, value: string) {
    setGrossMap((prev) => new Map(prev).set(playerId, value))
    setResultsDirty(true)
  }

  function setPositionOverride(playerId: string, value: string, autoPosVal: number | null) {
    setPositionOverrides((prev) => {
      const next = new Map(prev)
      // Clear override when value is empty or matches auto
      if (value === '' || (autoPosVal !== null && value === String(autoPosVal))) {
        next.delete(playerId)
      } else {
        next.set(playerId, value)
      }
      return next
    })
    setResultsDirty(true)
  }

  function validateResults(): string | null {
    if (initialEntries.length === 0) return 'No players are registered for this tournament.'

    const missingGross = displayRows.filter(
      (r) => r.gross === '' || isNaN(parseFloat(r.gross)),
    )
    if (missingGross.length > 0) {
      return `Missing gross score for: ${missingGross.map((r) => r.player_name).join(', ')}.`
    }

    const missingPts = displayRows.filter((r) => r.missing_points)
    if (missingPts.length > 0) {
      const positions = [...new Set(missingPts.map((r) => r.finish_position!))]
      return `No points allocated for position${positions.length > 1 ? 's' : ''} ${positions.join(', ')}. Update the Setup tab.`
    }

    // Overrides creating unintentional duplicates
    const posCount = new Map<number, number>()
    for (const r of displayRows) {
      if (r.finish_position !== null)
        posCount.set(r.finish_position, (posCount.get(r.finish_position) ?? 0) + 1)
    }
    const overrideDuplicate = displayRows.find(
      (r) => r.is_override && r.finish_position !== null && (posCount.get(r.finish_position) ?? 0) > 1,
    )
    if (overrideDuplicate) {
      return `Position ${overrideDuplicate.finish_position} is assigned to multiple players. Resolve the conflict or clear the override to use auto-rank.`
    }

    return null
  }

  function handleFinalizeResults() {
    const err = validateResults()
    if (err) {
      setResultsError(err)
      return
    }
    setResultsError(null)

    const label = tournament.course ?? 'Kickoff Tournament'
    if (
      !window.confirm(
        `Finalize and mark "${label}" as Complete?\n\nThis will update the public results page.`,
      )
    ) {
      return
    }

    const entriesToSave = displayRows.map((r) => ({
      player_id: r.player_id,
      team_id: r.team_id,
      gross_score: Math.round(parseFloat(r.gross)),
      handicap_used: r.handicap,
      net_score: r.net,
      finish_position: r.finish_position,
      points_awarded: r.points_awarded,
    }))

    startTransition(async () => {
      const result = await saveAllTournamentEntriesAction(tournament.id, entriesToSave)
      if ('error' in result) {
        setResultsError(result.error)
      } else {
        setResultsError(null)
        setResultsDirty(false)
        setSavedAt(new Date())
        router.refresh()
      }
    })
  }

  // ── SHARED ───────────────────────────────────────────────────────────────────

  const statusLabel = tournament.status === 'complete' ? 'Complete' : 'Setup'
  const statusClass =
    tournament.status === 'complete'
      ? 'bg-green-900/50 text-green-300 border border-green-700/50'
      : 'bg-yellow-900/50 text-yellow-300 border border-yellow-700/50'

  function teamName(teamId: string | null) {
    if (!teamId) return '—'
    return teams.find((t) => t.id === teamId)?.name ?? '—'
  }

  const scoresEntered = displayRows.filter((r) => r.gross !== '').length
  const noPointsConfigured = initialPositionPoints.length === 0
  const hasOverrides = displayRows.some((r) => r.is_override)
  const isAlreadyComplete = tournament.status === 'complete'

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href={`/admin/tournaments?season=${selectedSeasonId}`}
            className="text-xs text-gray-400 hover:text-white transition-colors shrink-0"
          >
            ← Tournaments
          </Link>
          <span className="text-gray-700 shrink-0">/</span>
          <h1 className="text-xl font-bold truncate">Kickoff Tournament</h1>
          <span
            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${statusClass}`}
          >
            {statusLabel}
          </span>
        </div>
        <select
          value={selectedSeasonId}
          onChange={(e) => router.push(`/admin/tournaments?season=${e.target.value}`)}
          className="bg-gray-800 border border-white/20 rounded px-3 py-2 text-sm text-white shrink-0"
        >
          {seasons.map((s) => (
            <option key={s.id} value={s.id}>
              {s.year}
            </option>
          ))}
        </select>
      </div>

      {/* Mode tabs */}
      <div className="flex gap-1 border-b border-white/10">
        {(['setup', 'results'] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              mode === m
                ? 'border-white text-white'
                : 'border-transparent text-gray-500 hover:text-gray-300'
            }`}
          >
            {m === 'setup' ? 'Setup' : 'Enter Results'}
          </button>
        ))}
      </div>

      {savedAt && (
        <p className="text-green-400 text-xs">Saved at {savedAt.toLocaleTimeString()}</p>
      )}

      {/* ── SETUP TAB ── */}
      {mode === 'setup' && (
        <div className="space-y-5">
          {/* Section 1: Tournament Details */}
          <section className="bg-white/5 rounded-xl border border-white/10 p-4 space-y-3">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Tournament Details
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Date *</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-gray-800 border border-white/20 rounded px-3 py-2 text-sm text-white"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Course</label>
                <input
                  type="text"
                  value={course}
                  onChange={(e) => setCourse(e.target.value)}
                  className="w-full bg-gray-800 border border-white/20 rounded px-3 py-2 text-sm text-white"
                  placeholder="e.g. Royal St George's"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Poster URL</label>
                <input
                  type="url"
                  value={posterUrl}
                  onChange={(e) => setPosterUrl(e.target.value)}
                  className="w-full bg-gray-800 border border-white/20 rounded px-3 py-2 text-sm text-white"
                  placeholder="https://..."
                />
              </div>
            </div>
          </section>

          {/* Section 2: Participating Players */}
          <section className="bg-white/5 rounded-xl border border-white/10 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Participating Players
              </h2>
              <div className="flex items-center gap-2">
                <label className="text-xs text-gray-500">Count</label>
                <input
                  type="number"
                  value={playerCount}
                  min={1}
                  max={50}
                  onChange={(e) => handlePlayerCountChange(e.target.value)}
                  className="w-16 bg-gray-800 border border-white/20 rounded px-2 py-1 text-sm text-white text-center"
                />
              </div>
            </div>
            <div className="overflow-x-auto rounded-lg border border-white/10">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-800 border-b border-white/10">
                    <th className="px-3 py-2 text-xs text-gray-400 font-medium text-center w-10">
                      #
                    </th>
                    <th className="px-3 py-2 text-xs text-gray-400 font-medium text-left">
                      Player
                    </th>
                    <th className="px-3 py-2 text-xs text-gray-400 font-medium text-center w-24">
                      HCP
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {playerRows.map((row, i) => {
                    const selectedOthers = new Set(
                      playerRows.filter((_, j) => j !== i).map((r) => r.player_id).filter(Boolean),
                    )
                    const available = playersWithTeams.filter((p) => !selectedOthers.has(p.id))
                    return (
                      <tr key={i} className="bg-gray-900">
                        <td className="px-3 py-2 text-center text-xs text-gray-500">{i + 1}</td>
                        <td className="px-2 py-1.5">
                          <select
                            value={row.player_id}
                            onChange={(e) => handlePlayerSelect(i, e.target.value)}
                            className="w-full bg-gray-700 border border-white/10 rounded px-2 py-1.5 text-sm text-white focus:outline-none focus:border-blue-500/60"
                          >
                            <option value="">— Select player —</option>
                            {available.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.full_name}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-2 py-1.5">
                          <input
                            type="number"
                            value={row.handicap_used}
                            step="0.1"
                            onChange={(e) =>
                              setPlayerRows((prev) => {
                                const next = [...prev]
                                next[i] = { ...next[i], handicap_used: e.target.value }
                                return next
                              })
                            }
                            className="w-full bg-gray-700 border border-white/10 rounded px-2 py-1 text-center text-sm text-white focus:outline-none focus:border-blue-500/60"
                            placeholder="0"
                          />
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </section>

          {/* Section 3: Position Points */}
          <section className="bg-white/5 rounded-xl border border-white/10 p-4 space-y-3">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Points by Finishing Position
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {positionPointsRows.map((pp, i) => (
                <div key={pp.finish_position} className="flex items-center gap-2">
                  <span className="text-xs text-gray-400 w-10 shrink-0 text-right tabular-nums">
                    {ordinal(pp.finish_position)}
                  </span>
                  <input
                    type="number"
                    value={pp.points}
                    step="any"
                    onChange={(e) =>
                      setPositionPointsRows((prev) => {
                        const next = [...prev]
                        next[i] = { ...next[i], points: e.target.value }
                        return next
                      })
                    }
                    className="flex-1 min-w-0 bg-gray-700 border border-white/10 rounded px-2 py-1 text-center text-sm text-white focus:outline-none focus:border-blue-500/60 tabular-nums"
                    placeholder="pts"
                  />
                </div>
              ))}
            </div>
            <p className="text-[10px] text-gray-600">Negative values are allowed.</p>
          </section>

          {setupError && <p className="text-red-400 text-sm">{setupError}</p>}

          <div className="flex justify-end">
            <button
              onClick={handleSaveSetup}
              disabled={isPending}
              className="bg-blue-700 hover:bg-blue-600 disabled:opacity-40 text-white text-sm font-medium px-6 py-2 rounded transition-colors"
            >
              {isPending ? 'Saving…' : 'Save Setup'}
            </button>
          </div>
        </div>
      )}

      {/* ── RESULTS TAB ── */}
      {mode === 'results' && (
        <div className="space-y-4">
          {initialEntries.length === 0 ? (
            <div className="bg-white/5 rounded-xl border border-white/10 p-8 text-center space-y-3">
              <p className="text-gray-400 text-sm">
                No players are registered for this tournament yet.
              </p>
              <button
                onClick={() => setMode('setup')}
                className="text-xs text-blue-400 hover:text-blue-300"
              >
                Go to Setup →
              </button>
            </div>
          ) : (
            <>
              {/* Warnings */}
              {noPointsConfigured && (
                <div className="bg-yellow-900/30 border border-yellow-700/40 rounded-lg px-4 py-3 text-sm text-yellow-300">
                  No position points configured. Go to Setup to add points allocations before
                  finalizing.
                </div>
              )}

              {isAlreadyComplete && (
                <div className="bg-green-900/20 border border-green-700/30 rounded-lg px-4 py-3 text-xs text-green-400">
                  This tournament is marked Complete. You can update results and re-finalize if
                  needed.
                </div>
              )}

              {/* Instruction line */}
              <p className="text-xs text-gray-500">
                Enter gross scores. Net scores, finish positions, and points are calculated
                automatically. Override a finish position by typing into the Pos field — amber
                indicates a manual override.
              </p>

              {/* Results table */}
              <div className="overflow-x-auto rounded-lg border border-white/10">
                <table className="w-full text-sm min-w-[580px]">
                  <thead>
                    <tr className="bg-gray-800 border-b border-white/10 text-left">
                      <th className="px-3 py-2.5 text-xs font-medium text-gray-400">Player</th>
                      <th className="px-3 py-2.5 text-xs font-medium text-gray-400">Team</th>
                      <th className="px-3 py-2.5 text-xs font-medium text-gray-400 text-center w-12">
                        HCP
                      </th>
                      <th className="px-3 py-2.5 text-xs font-medium text-gray-400 text-center w-24">
                        Gross
                      </th>
                      <th className="px-3 py-2.5 text-xs font-medium text-gray-400 text-center w-14">
                        Net
                      </th>
                      <th className="px-3 py-2.5 text-xs font-medium text-gray-400 text-center w-20">
                        Pos
                      </th>
                      <th className="px-3 py-2.5 text-xs font-medium text-gray-400 text-right w-16">
                        Pts
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {displayRows.map((row) => (
                      <tr
                        key={row.player_id}
                        className="bg-gray-900 hover:bg-gray-800/60 transition-colors"
                      >
                        {/* Player */}
                        <td className="px-3 py-2 font-medium text-white whitespace-nowrap">
                          {row.player_name}
                        </td>

                        {/* Team */}
                        <td className="px-3 py-2 text-xs text-gray-400 whitespace-nowrap">
                          {teamName(row.team_id)}
                        </td>

                        {/* Handicap */}
                        <td className="px-3 py-2 text-center text-gray-400 tabular-nums">
                          {row.handicap}
                        </td>

                        {/* Gross — editable */}
                        <td className="px-2 py-1.5">
                          <input
                            type="number"
                            value={row.gross}
                            min={18}
                            max={200}
                            onChange={(e) => setGross(row.player_id, e.target.value)}
                            className="w-full bg-gray-700 border border-white/10 rounded px-2 py-1 text-center text-sm text-white focus:outline-none focus:border-blue-500/60 tabular-nums"
                            placeholder="—"
                          />
                        </td>

                        {/* Net — computed, read-only */}
                        <td className="px-3 py-2 text-center tabular-nums">
                          {row.net !== null ? (
                            <span className="text-gray-200">{row.net}</span>
                          ) : (
                            <span className="text-gray-600">—</span>
                          )}
                        </td>

                        {/* Finish position — editable override */}
                        <td className="px-2 py-1.5">
                          <input
                            type="number"
                            min={1}
                            value={row.finish_position_str}
                            onChange={(e) =>
                              setPositionOverride(
                                row.player_id,
                                e.target.value,
                                row.auto_position,
                              )
                            }
                            className={`w-full rounded px-2 py-1 text-center text-sm focus:outline-none tabular-nums transition-colors ${
                              row.is_override
                                ? 'bg-amber-900/40 border border-amber-600/60 text-amber-200 focus:border-amber-400'
                                : 'bg-gray-700 border border-white/10 text-gray-300 focus:border-blue-500/60'
                            }`}
                            placeholder="—"
                          />
                        </td>

                        {/* Points — auto-assigned, read-only */}
                        <td className="px-3 py-2 text-right tabular-nums">
                          {row.missing_points ? (
                            <span className="text-red-400 text-[10px] font-medium">no pts</span>
                          ) : row.points_awarded !== null ? (
                            <span
                              className={`font-semibold ${
                                row.points_awarded > 0
                                  ? 'text-white'
                                  : row.points_awarded < 0
                                    ? 'text-red-400'
                                    : 'text-gray-400'
                              }`}
                            >
                              {row.points_awarded > 0
                                ? `+${row.points_awarded}`
                                : row.points_awarded}
                            </span>
                          ) : (
                            <span className="text-gray-600">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Hint lines */}
              {hasOverrides && (
                <p className="text-xs text-amber-600/80">
                  Amber positions are manually overridden. Clear the field to revert to auto-rank.
                </p>
              )}

              {/* Error */}
              {resultsError && (
                <div className="bg-red-900/30 border border-red-700/40 rounded-lg px-4 py-3 text-sm text-red-300">
                  {resultsError}
                </div>
              )}

              {/* Footer bar */}
              <div className="flex items-center justify-between gap-4">
                <p className="text-xs text-gray-500">
                  {scoresEntered} / {displayRows.length} scores entered
                </p>
                <button
                  onClick={handleFinalizeResults}
                  disabled={isPending || !resultsDirty}
                  className="bg-green-700 hover:bg-green-600 disabled:opacity-40 text-white text-sm font-medium px-6 py-2 rounded transition-colors"
                >
                  {isPending
                    ? 'Saving…'
                    : isAlreadyComplete
                      ? 'Update Results'
                      : 'Finalize Results'}
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
