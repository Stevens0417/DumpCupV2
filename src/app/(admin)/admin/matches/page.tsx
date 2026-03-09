import { redirect } from 'next/navigation'
import { listSeasons } from '@/lib/db/seasons'
import { listTeamsBySeason } from '@/lib/db/teams'
import { listActivePlayers } from '@/lib/db/players'
import { listRostersBySeason } from '@/lib/db/rosters'
import { listMatchTypes } from '@/lib/db/matchTypes'
import { listAllAllocations } from '@/lib/db/matchTypeAllocations'
import { listMatchesBySeason } from '@/lib/db/matches'
import MatchesClient from './MatchesClient'

export default async function AdminMatchesPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  const seasons = await listSeasons()

  // Auto-select newest season if none specified
  const rawSeason = typeof searchParams.season === 'string' ? searchParams.season : null
  if (!rawSeason && seasons.length > 0) {
    redirect(`/admin/matches?season=${seasons[0].id}`)
  }
  const selectedSeasonId = rawSeason

  const [matchTypes, allAllocations] = await Promise.all([
    listMatchTypes(),
    listAllAllocations(),
  ])

  const [teams, players, rosters, matches] = selectedSeasonId
    ? await Promise.all([
        listTeamsBySeason(selectedSeasonId),
        listActivePlayers(),
        listRostersBySeason(selectedSeasonId),
        listMatchesBySeason(selectedSeasonId),
      ])
    : [[], [], [], []]

  return (
    <MatchesClient
      seasons={seasons}
      selectedSeasonId={selectedSeasonId}
      matchTypes={matchTypes}
      allAllocations={allAllocations}
      teams={teams}
      players={players}
      rosters={rosters}
      matches={matches}
    />
  )
}
