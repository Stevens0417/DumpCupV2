import { redirect } from 'next/navigation'
import { listSeasons } from '@/lib/db/seasons'
import { listTeamsBySeason } from '@/lib/db/teams'
import { listActivePlayers } from '@/lib/db/players'
import { listAwardsBySeason } from '@/lib/db/awards'
import AwardsClient from './AwardsClient'

export default async function AdminAwardsPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  const seasons = await listSeasons()
  if (seasons.length === 0) {
    return (
      <div className="p-4">
        <h1 className="text-xl font-bold">Awards</h1>
        <p className="text-gray-400 text-sm mt-2">No seasons found. Create a season first.</p>
      </div>
    )
  }

  const rawSeason = typeof searchParams.season === 'string' ? searchParams.season : null
  if (!rawSeason) {
    redirect(`/admin/awards?season=${seasons[0].id}`)
  }
  const seasonId = rawSeason

  const [teams, players, awards] = await Promise.all([
    listTeamsBySeason(seasonId),
    listActivePlayers(),
    listAwardsBySeason(seasonId),
  ])

  return (
    <AwardsClient
      seasons={seasons}
      selectedSeasonId={seasonId}
      teams={teams}
      players={players}
      awards={awards}
    />
  )
}
