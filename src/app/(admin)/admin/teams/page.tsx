import { listSeasons } from '@/lib/db/seasons'
import { listTeamsBySeason } from '@/lib/db/teams'
import { listPlayers } from '@/lib/db/players'
import TeamsClient from './TeamsClient'

export default async function AdminTeamsPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  const [seasons, players] = await Promise.all([listSeasons(), listPlayers()])
  const selectedSeasonId =
    typeof searchParams.season === 'string' ? searchParams.season : null
  const teams = selectedSeasonId ? await listTeamsBySeason(selectedSeasonId) : []

  return (
    <div>
      <h1 className="text-xl font-bold mb-6">Teams</h1>
      <TeamsClient
        seasons={seasons}
        teams={teams}
        players={players}
        selectedSeasonId={selectedSeasonId}
      />
    </div>
  )
}
