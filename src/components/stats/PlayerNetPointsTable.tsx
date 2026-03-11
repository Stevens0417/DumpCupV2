'use client'

import { useState, useMemo } from 'react'
import type { PlayerNetPoints } from '@/lib/db/stats'

type Season = { id: string; year: number }

type Props = {
  rows: PlayerNetPoints[]
  seasons: Season[]
  error?: string
}

type DisplayRow = {
  player_id: string
  player_name: string
  points_won: number
  points_lost: number
  net_points: number
}

function fmt(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(1)
}

export default function PlayerNetPointsTable({ rows, seasons, error }: Props) {
  const defaultId = seasons[0]?.id ?? 'all'
  const [selected, setSelected] = useState<string>(defaultId)

  const displayRows = useMemo((): DisplayRow[] => {
    let filtered: DisplayRow[]

    if (selected === 'all') {
      const map = new Map<string, DisplayRow>()
      for (const r of rows) {
        const ex = map.get(r.player_id)
        if (ex) {
          ex.points_won += r.points_won
          ex.points_lost += r.points_lost
          ex.net_points += r.net_points
        } else {
          map.set(r.player_id, {
            player_id: r.player_id,
            player_name: r.player_name,
            points_won: r.points_won,
            points_lost: r.points_lost,
            net_points: r.net_points,
          })
        }
      }
      filtered = [...map.values()]
    } else {
      filtered = rows
        .filter((r) => r.season_id === selected)
        .map((r) => ({
          player_id: r.player_id,
          player_name: r.player_name,
          points_won: r.points_won,
          points_lost: r.points_lost,
          net_points: r.net_points,
        }))
    }

    return filtered.sort(
      (a, b) =>
        b.net_points - a.net_points ||
        b.points_won - a.points_won ||
        a.player_name.localeCompare(b.player_name),
    )
  }, [rows, selected])

  const pills = [
    ...seasons.map((s) => ({ id: s.id, label: String(s.year) })),
    { id: 'all', label: 'All Time' },
  ]

  if (error) {
    return <p className="text-xs text-red-400 text-center py-4">{error}</p>
  }

  if (seasons.length === 0) {
    return <p className="text-xs text-gray-500 text-center py-4">No data yet</p>
  }

  return (
    <div>
      {/* Season selector */}
      <div className="flex gap-1.5 flex-wrap mb-4">
        {pills.map((p) => (
          <button
            key={p.id}
            onClick={() => setSelected(p.id)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              selected === p.id
                ? 'bg-white/20 text-white'
                : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-gray-200'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {displayRows.length === 0 ? (
        <p className="text-xs text-gray-500 text-center py-4">No data for this season</p>
      ) : (
        <div className="w-full">
          {/* Header */}
          <div className="grid grid-cols-[1rem_1fr_3rem_3rem_3rem] gap-x-2 pb-1.5 border-b border-white/10 mb-0.5">
            <span className="text-[10px] text-gray-600 text-right">#</span>
            <span className="text-[10px] text-gray-600">Player</span>
            <span className="text-[10px] text-gray-600 text-right">Won</span>
            <span className="text-[10px] text-gray-600 text-right">Lost</span>
            <span className="text-[10px] text-gray-600 text-right">Net</span>
          </div>

          {/* Rows */}
          <div>
            {displayRows.map((row, i) => (
              <div
                key={row.player_id}
                className="grid grid-cols-[1rem_1fr_3rem_3rem_3rem] gap-x-2 py-1.5 border-b border-white/5 last:border-0"
              >
                <span className="text-[11px] text-gray-600 text-right tabular-nums leading-none pt-px">
                  {i + 1}
                </span>
                <span className="text-xs text-gray-200 leading-none truncate">{row.player_name}</span>
                <span className="text-[11px] text-gray-400 text-right tabular-nums leading-none">
                  {fmt(row.points_won)}
                </span>
                <span className="text-[11px] text-gray-400 text-right tabular-nums leading-none">
                  {fmt(row.points_lost)}
                </span>
                <span
                  className={`text-[11px] font-semibold text-right tabular-nums leading-none ${
                    row.net_points > 0
                      ? 'text-white'
                      : row.net_points < 0
                        ? 'text-gray-500'
                        : 'text-gray-400'
                  }`}
                >
                  {row.net_points > 0 ? '+' : ''}
                  {fmt(row.net_points)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
