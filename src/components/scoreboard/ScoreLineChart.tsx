'use client'

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts'

export type WeeklyProgression = {
  team_name: string
  week_start: string        // ISO date string "YYYY-MM-DD"
  cumulative_points: number
}

type Props = {
  data: WeeklyProgression[]
}

function formatWeek(dateStr: string): string {
  // append time to avoid UTC date-shift on different timezones
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// Assign stable colors by name pattern; fall back for unexpected teams
const TEAM_COLORS: { test: (name: string) => boolean; color: string }[] = [
  { test: (n) => n.toLowerCase().includes('dresden'), color: '#f87171' }, // red-400
  { test: (n) => n.toLowerCase().includes('york'), color: '#60a5fa' },    // blue-400
]
const FALLBACK_COLORS = ['#34d399', '#a78bfa', '#fb923c', '#facc15']

function teamColor(name: string, idx: number): string {
  return TEAM_COLORS.find((t) => t.test(name))?.color ?? FALLBACK_COLORS[idx % FALLBACK_COLORS.length]
}

export default function ScoreLineChart({ data }: Props) {
  if (data.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-xs text-gray-500">No progression data yet</p>
      </div>
    )
  }

  // Collect all team names and all unique weeks
  const teamNames = [...new Set(data.map((d) => d.team_name))].sort()
  const allWeeks = [...new Set(data.map((d) => d.week_start))].sort()

  // Merge into a single array keyed by week_start for Recharts multi-line
  const chartData = allWeeks.map((week) => {
    const entry: Record<string, string | number | null> = { week_start: week }
    for (const team of teamNames) {
      const row = data.find((d) => d.team_name === team && d.week_start === week)
      entry[team] = row?.cumulative_points ?? null
    }
    return entry
  })

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={chartData} margin={{ top: 8, right: 12, bottom: 0, left: -12 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.07)" vertical={false} />
        <XAxis
          dataKey="week_start"
          tickFormatter={formatWeek}
          tick={{ fill: '#6b7280', fontSize: 9 }}
          tickLine={false}
          axisLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          tick={{ fill: '#6b7280', fontSize: 9 }}
          tickLine={false}
          axisLine={false}
          width={30}
          allowDecimals={false}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: '#111827',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: '8px',
            fontSize: '11px',
            color: '#f3f4f6',
          }}
          labelFormatter={(label: string) => formatWeek(label)}
          formatter={(value: number, name: string) => [`${value} pts`, name]}
        />
        <Legend
          iconType="circle"
          iconSize={7}
          wrapperStyle={{ fontSize: '10px', color: '#9ca3af', paddingTop: '4px' }}
        />
        {teamNames.map((team, idx) => (
          <Line
            key={team}
            type="monotone"
            dataKey={team}
            stroke={teamColor(team, idx)}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, strokeWidth: 0 }}
            connectNulls
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  )
}
