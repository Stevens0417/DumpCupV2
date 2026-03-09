import Link from 'next/link'
import { redirect } from 'next/navigation'
import { listSeasons } from '@/lib/db/seasons'
import { listTeamsBySeason } from '@/lib/db/teams'
import { listMatchTypes } from '@/lib/db/matchTypes'
import { getTournamentById } from '@/lib/db/tournaments'
import { listMatchesByTournament, listMatchPlayersByMatchIds } from '@/lib/db/matches'
import { getPlayersWithTeams } from '@/lib/db/tournamentUtils'
import YearendClient from './YearendClient'

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

export default async function YearendPage({
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

  const today = new Date().toISOString().split('T')[0]

  const [tournament, matchTypes, teams, playersWithTeams] = await Promise.all([
    getTournamentById(rawTournamentId),
    listMatchTypes(),
    listTeamsBySeason(seasonId),
    getPlayersWithTeams(seasonId, today),
  ])

  if (!tournament) return <NotSetUp seasonId={seasonId} />

  const matches = await listMatchesByTournament(tournament.id)
  const matchPlayers = await listMatchPlayersByMatchIds(matches.map((m) => m.id))

  const oneVOneMatchType = matchTypes.find((mt) => mt.players_per_team === 1) ?? null

  return (
    <YearendClient
      seasons={seasons}
      selectedSeasonId={seasonId}
      tournament={tournament}
      oneVOneMatchType={oneVOneMatchType}
      teams={teams}
      playersWithTeams={playersWithTeams}
      matches={matches}
      matchPlayers={matchPlayers}
    />
  )
}
