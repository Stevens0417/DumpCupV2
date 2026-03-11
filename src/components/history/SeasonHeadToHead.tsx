'use client'

import { useState, useMemo } from 'react'
import type { TeamPointsHistory } from '@/lib/db/history'

const ALL_TIME = 'all'

type Props = {
  historyRows: TeamPointsHistory[]
}

function fmt(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(1)
}

function scoreFontClass(maxLen: number): string {
  if (maxLen <= 3) return 'text-6xl'
  if (maxLen <= 4) return 'text-5xl'
  return 'text-4xl'
}

export default function SeasonHeadToHead({ historyRows }: Props) {
  const [selectedId, setSelectedId] = useState<string>(ALL_TIME)

  // Derive unique seasons from scope='season' rows, sorted latest first
  const seasons = useMemo(() => {
    const map = new Map<string, { id: string; year: number }>()
    for (const r of historyRows) {
      if (r.scope === 'season' && r.season_id && r.season_year != null) {
        if (!map.has(r.season_id)) {
          map.set(r.season_id, { id: r.season_id, year: r.season_year })
        }
      }
    }
    return [...map.values()].sort((a, b) => b.year - a.year)
  }, [historyRows])

  const { dresdenPts, yorkPts, dresdenName, yorkName } = useMemo(() => {
    const rows =
      selectedId === ALL_TIME
        ? historyRows.filter((r) => r.scope === 'all_time')
        : historyRows.filter((r) => r.scope === 'season' && r.season_id === selectedId)

    const dresden = rows.find((r) => r.team_name.toLowerCase().includes('dresden'))
    const york = rows.find((r) => r.team_name.toLowerCase().includes('york'))
    return {
      dresdenPts: dresden?.total_points ?? 0,
      yorkPts: york?.total_points ?? 0,
      dresdenName: dresden?.team_name ?? 'Dresden',
      yorkName: york?.team_name ?? 'York',
    }
  }, [historyRows, selectedId])

  if (historyRows.length === 0) return null

  const dresdenWins = dresdenPts > yorkPts
  const yorkWins = yorkPts > dresdenPts

  // Use the same font size for both sides so the layout stays balanced
  const fontClass = scoreFontClass(
    Math.max(fmt(dresdenPts).length, fmt(yorkPts).length),
  )

  const pills = [
    { id: ALL_TIME, label: 'All Time' },
    ...seasons.map((s) => ({ id: s.id, label: String(s.year) })),
  ]

  return (
    <div className="mx-4 mb-4 bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
      {/* Season selector */}
      <div className="flex gap-1.5 flex-wrap justify-center px-4 pt-4 pb-3 border-b border-white/10">
        {pills.map((p) => (
          <button
            key={p.id}
            onClick={() => setSelectedId(p.id)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              selectedId === p.id
                ? 'bg-white/20 text-white'
                : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-gray-200'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Head-to-head display */}
      <div className="flex items-center justify-between px-6 py-5">
        {/* Dresden */}
        <div className="flex flex-col items-center gap-1 flex-1">
          <span className="text-[10px] font-bold tracking-widest text-red-400 mb-1">
            {dresdenName.toUpperCase()}
          </span>
          <span
            className={`${fontClass} font-black tabular-nums leading-none text-red-400 transition-opacity ${
              yorkWins ? 'opacity-40' : 'opacity-100'
            }`}
          >
            {fmt(dresdenPts)}
          </span>
          {dresdenWins && (
            <span className="text-[10px] font-semibold text-red-400 mt-1 tracking-wider">
              WINNER
            </span>
          )}
        </div>

        {/* Divider */}
        <div className="flex flex-col items-center px-2">
          <span className="text-gray-600 text-xs font-semibold tracking-widest">VS</span>
        </div>

        {/* York */}
        <div className="flex flex-col items-center gap-1 flex-1">
          <span className="text-[10px] font-bold tracking-widest text-blue-400 mb-1">
            {yorkName.toUpperCase()}
          </span>
          <span
            className={`${fontClass} font-black tabular-nums leading-none text-blue-400 transition-opacity ${
              dresdenWins ? 'opacity-40' : 'opacity-100'
            }`}
          >
            {fmt(yorkPts)}
          </span>
          {yorkWins && (
            <span className="text-[10px] font-semibold text-blue-400 mt-1 tracking-wider">
              WINNER
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
