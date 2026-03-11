import PageHeader from '@/components/layout/PageHeader'
import SectionCard from '@/components/ui/SectionCard'
import PlayerNetPointsTable from '@/components/stats/PlayerNetPointsTable'
import { getAllPlayerNetPoints } from '@/lib/db/stats'
import type { PlayerNetPoints } from '@/lib/db/stats'

export default async function StatsPage() {
  let rows: PlayerNetPoints[] = []
  let fetchError: string | undefined

  try {
    rows = await getAllPlayerNetPoints()
  } catch {
    fetchError = 'Failed to load stats'
  }

  // Derive unique seasons sorted latest first
  const seasonMap = new Map<string, { id: string; year: number }>()
  for (const r of rows) {
    if (!seasonMap.has(r.season_id)) {
      seasonMap.set(r.season_id, { id: r.season_id, year: r.season_year })
    }
  }
  const seasons = [...seasonMap.values()].sort((a, b) => b.year - a.year)

  return (
    <div className="pb-4">
      <PageHeader title="Stats" subtitle="Player and team statistics" />

      <div className="px-4">
        <SectionCard title="Player Leaderboard">
          <PlayerNetPointsTable rows={rows} seasons={seasons} error={fetchError} />
        </SectionCard>
      </div>
    </div>
  )
}
