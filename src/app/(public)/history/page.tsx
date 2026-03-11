import PageHeader from '@/components/layout/PageHeader'
import SectionCard from '@/components/ui/SectionCard'
import SeasonHeadToHead from '@/components/history/SeasonHeadToHead'
import { AWARD_LABELS } from '@/lib/domain/awards'
import { getAwardsHistory, getAllSeasonTeamScores, getTeamPointsHistory } from '@/lib/db/history'
import type { HistorySeasonScore } from '@/lib/db/history'

function fmt(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(1)
}

function fmtAward(a: string): string {
  return (AWARD_LABELS as Record<string, string>)[a] ?? a.replace(/_/g, ' ')
}

type SeasonRow = {
  season_year: number
  teams: { name: string; points: number }[]
}

function pivotSeasonScores(scores: HistorySeasonScore[]): SeasonRow[] {
  const byYear = new Map<number, Map<string, number>>()
  for (const row of scores) {
    if (!byYear.has(row.season_year)) byYear.set(row.season_year, new Map())
    byYear.get(row.season_year)!.set(row.team_name, row.total_points)
  }
  return [...byYear.entries()]
    .sort(([a], [b]) => b - a)
    .map(([season_year, teams]) => ({
      season_year,
      teams: [...teams.entries()].map(([name, points]) => ({ name, points })),
    }))
}

export default async function HistoryPage() {
  let awards: Awaited<ReturnType<typeof getAwardsHistory>> = []
  let seasonScores: HistorySeasonScore[] = []
  let historyRows: Awaited<ReturnType<typeof getTeamPointsHistory>> = []
  let fetchError = false

  try {
    ;[awards, seasonScores, historyRows] = await Promise.all([
      getAwardsHistory(),
      getAllSeasonTeamScores(),
      getTeamPointsHistory(),
    ])
  } catch {
    fetchError = true
  }

  const seasonRows = pivotSeasonScores(seasonScores)

  // Column order: Dresden first, York second, others after
  const allTeamNames = [...new Set(seasonScores.map((r) => r.team_name))]
  const colOrder = [
    ...allTeamNames.filter((n) => n.toLowerCase().includes('dresden')),
    ...allTeamNames.filter((n) => n.toLowerCase().includes('york')),
    ...allTeamNames.filter(
      (n) => !n.toLowerCase().includes('dresden') && !n.toLowerCase().includes('york'),
    ),
  ]

  return (
    <div className="pb-4">
      <PageHeader title="History" subtitle="Past seasons and awards" />

      {fetchError && (
        <p className="text-xs text-red-400 text-center py-2 px-4">Failed to load history data</p>
      )}

      {/* Top: Season head-to-head summary */}
      {historyRows.length > 0 && (
        <SeasonHeadToHead historyRows={historyRows} />
      )}

      <div className="px-4 space-y-4">

        {/* Awards */}
        <SectionCard title="Awards">
          {awards.length === 0 ? (
            <p className="text-xs text-gray-500 text-center py-4">No awards yet</p>
          ) : (
            <div>
              <div className="grid grid-cols-[3rem_1fr_auto] gap-x-3 pb-1.5 border-b border-white/10 mb-0.5">
                <span className="text-[10px] text-gray-600">Season</span>
                <span className="text-[10px] text-gray-600">Player</span>
                <span className="text-[10px] text-gray-600 text-right">Award</span>
              </div>
              <div>
                {awards.map((row, i) => (
                  <div
                    key={i}
                    className="grid grid-cols-[3rem_1fr_auto] gap-x-3 py-1.5 border-b border-white/5 last:border-0"
                  >
                    <span className="text-[11px] text-gray-500 tabular-nums leading-none pt-px">
                      {row.season_year}
                    </span>
                    <span className="text-xs text-gray-200 leading-none truncate">
                      {row.player_name ?? '—'}
                    </span>
                    <span className="text-[11px] text-gray-400 text-right leading-none whitespace-nowrap">
                      {fmtAward(row.award)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </SectionCard>

        {/* Season-by-season points */}
        <SectionCard title="Season Results">
          {seasonRows.length === 0 ? (
            <p className="text-xs text-gray-500 text-center py-4">No seasons yet</p>
          ) : (
            <div>
              <div
                className="pb-1.5 border-b border-white/10 mb-0.5"
                style={{
                  display: 'grid',
                  gridTemplateColumns: `3rem repeat(${colOrder.length}, 1fr)`,
                  gap: '0.5rem',
                }}
              >
                <span className="text-[10px] text-gray-600">Season</span>
                {colOrder.map((name) => {
                  const isDresden = name.toLowerCase().includes('dresden')
                  const colorClass = isDresden ? 'text-red-400' : 'text-blue-400'
                  return (
                    <span key={name} className={`text-[10px] font-semibold text-right ${colorClass}`}>
                      {name.split(' ').pop()}
                    </span>
                  )
                })}
              </div>
              <div>
                {seasonRows.map((row) => (
                  <div
                    key={row.season_year}
                    className="py-1.5 border-b border-white/5 last:border-0"
                    style={{
                      display: 'grid',
                      gridTemplateColumns: `3rem repeat(${colOrder.length}, 1fr)`,
                      gap: '0.5rem',
                    }}
                  >
                    <span className="text-[11px] text-gray-500 tabular-nums leading-none pt-px">
                      {row.season_year}
                    </span>
                    {colOrder.map((teamName) => {
                      const teamData = row.teams.find((t) => t.name === teamName)
                      return (
                        <span
                          key={teamName}
                          className="text-[11px] text-gray-300 text-right tabular-nums leading-none"
                        >
                          {teamData ? fmt(teamData.points) : '—'}
                        </span>
                      )
                    })}
                  </div>
                ))}
              </div>
            </div>
          )}
        </SectionCard>

      </div>
    </div>
  )
}
