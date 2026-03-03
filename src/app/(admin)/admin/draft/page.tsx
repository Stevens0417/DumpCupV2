import { listSeasons } from '@/lib/db/seasons'
import { listTeamsBySeason } from '@/lib/db/teams'
import { listActivePlayers } from '@/lib/db/players'
import { listRostersBySeason } from '@/lib/db/rosters'
import DraftClient from './DraftClient'

export default async function AdminDraftPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  const seasons = await listSeasons()
  const selectedSeasonId =
    typeof searchParams.season === 'string' ? searchParams.season : null

  const [teams, players, rosters] = await Promise.all([
    selectedSeasonId ? listTeamsBySeason(selectedSeasonId) : Promise.resolve([]),
    listActivePlayers(),
    selectedSeasonId ? listRostersBySeason(selectedSeasonId) : Promise.resolve([]),
  ])

  return (
    <div>
      <h1 className="text-xl font-bold mb-6">Draft / Rosters</h1>
      <DraftClient
        seasons={seasons}
        teams={teams}
        players={players}
        rosters={rosters}
        selectedSeasonId={selectedSeasonId}
      />
    </div>
  )
}
