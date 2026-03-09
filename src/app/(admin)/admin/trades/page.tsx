import { redirect } from 'next/navigation'
import { listSeasons } from '@/lib/db/seasons'
import { listTeamsBySeason } from '@/lib/db/teams'
import { listActivePlayers } from '@/lib/db/players'
import { listActiveRostersBySeason, listDerivedTradesBySeason } from '@/lib/db/trades'
import TradesClient from './TradesClient'

export default async function AdminTradesPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  const seasons = await listSeasons()
  if (seasons.length === 0) {
    return (
      <div className="p-4">
        <h1 className="text-xl font-bold">Trades</h1>
        <p className="text-gray-400 text-sm mt-2">No seasons found. Create a season first.</p>
      </div>
    )
  }

  const rawSeason = typeof searchParams.season === 'string' ? searchParams.season : null
  if (!rawSeason) {
    redirect(`/admin/trades?season=${seasons[0].id}`)
  }
  const seasonId = rawSeason

  const [teams, players, activeRosters, trades] = await Promise.all([
    listTeamsBySeason(seasonId),
    listActivePlayers(),
    listActiveRostersBySeason(seasonId),
    listDerivedTradesBySeason(seasonId),
  ])

  return (
    <TradesClient
      seasons={seasons}
      selectedSeasonId={seasonId}
      teams={teams}
      players={players}
      activeRosters={activeRosters}
      trades={trades}
    />
  )
}
