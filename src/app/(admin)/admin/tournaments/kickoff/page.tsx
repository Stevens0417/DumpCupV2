import Link from 'next/link'
import { redirect } from 'next/navigation'
import { listSeasons } from '@/lib/db/seasons'
import { listTeamsBySeason } from '@/lib/db/teams'
import { getTournamentById } from '@/lib/db/tournaments'
import { getPlayersWithTeams } from '@/lib/db/tournamentUtils'
import { listTournamentEntries } from '@/lib/db/tournamentEntries'
import { listPositionPoints } from '@/lib/db/tournamentPositionPoints'
import KickoffClient from './KickoffClient'

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

export default async function KickoffPage({
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

  const tournament = await getTournamentById(rawTournamentId)
  if (!tournament) return <NotSetUp seasonId={seasonId} />

  // Use the tournament's own date for roster lookup so trades are handled correctly.
  // Fall back to today only if the tournament has no date yet (brand-new setup).
  const rosterDate = tournament.tournament_date ?? today

  const [playersWithTeams, teams, initialEntries, initialPositionPoints] = await Promise.all([
    getPlayersWithTeams(seasonId, rosterDate),
    listTeamsBySeason(seasonId),
    listTournamentEntries(rawTournamentId),
    listPositionPoints(rawTournamentId),
  ])

  return (
    <KickoffClient
      seasons={seasons}
      selectedSeasonId={seasonId}
      tournament={tournament}
      playersWithTeams={playersWithTeams}
      teams={teams}
      initialEntries={initialEntries}
      initialPositionPoints={initialPositionPoints}
    />
  )
}
