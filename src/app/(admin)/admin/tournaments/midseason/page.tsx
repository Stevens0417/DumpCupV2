import Link from 'next/link'
import { redirect } from 'next/navigation'
import { listSeasons } from '@/lib/db/seasons'
import { listTeamsBySeason } from '@/lib/db/teams'
import { listActivePlayers } from '@/lib/db/players'
import { listRostersBySeason } from '@/lib/db/rosters'
import { listMatchTypes } from '@/lib/db/matchTypes'
import { listAllAllocations } from '@/lib/db/matchTypeAllocations'
import { getTournamentById } from '@/lib/db/tournaments'
import { listMatchesByTournament } from '@/lib/db/matches'
import MidseasonClient from './MidseasonClient'

function NotSetUp({ seasonId }: { seasonId: string }) {
  return (
    <div className="p-6 space-y-3">
      <p className="text-gray-400 text-sm">
        This tournament has not been set up yet for this season.
      </p>
      <Link
        href={`/admin/tournaments?season=${seasonId}`}
        className="text-xs text-blue-400 hover:text-blue-300"
      >
        ← Back to Tournaments
      </Link>
    </div>
  )
}

export default async function MidseasonPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  const seasons = await listSeasons()
  if (seasons.length === 0) redirect('/admin/tournaments')

  const rawSeason = typeof searchParams.season === 'string' ? searchParams.season : null
  if (!rawSeason) redirect('/admin/tournaments')
  const seasonId = rawSeason

  const rawTournamentId =
    typeof searchParams.tournament === 'string' ? searchParams.tournament : null
  if (!rawTournamentId) return <NotSetUp seasonId={seasonId} />

  const [tournament, matchTypes, allAllocations, teams, players, rosters] = await Promise.all([
    getTournamentById(rawTournamentId),
    listMatchTypes(),
    listAllAllocations(),
    listTeamsBySeason(seasonId),
    listActivePlayers(),
    listRostersBySeason(seasonId),
  ])

  if (!tournament) return <NotSetUp seasonId={seasonId} />

  const matches = await listMatchesByTournament(tournament.id)

  return (
    <MidseasonClient
      seasons={seasons}
      selectedSeasonId={seasonId}
      tournament={tournament}
      matchTypes={matchTypes}
      allAllocations={allAllocations}
      teams={teams}
      players={players}
      rosters={rosters}
      matches={matches}
    />
  )
}
