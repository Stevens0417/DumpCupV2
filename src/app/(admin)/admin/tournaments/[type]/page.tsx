import { redirect, notFound } from 'next/navigation'
import { listSeasons } from '@/lib/db/seasons'
import { listTeamsBySeason } from '@/lib/db/teams'
import { getTournamentBySeasonAndType } from '@/lib/db/tournaments'
import { getPlayersWithTeams } from '@/lib/db/tournamentUtils'
import TournamentTypePageClient from './TournamentTypePageClient'

const VALID_TYPES = ['kickoff', 'midseason', 'yearend'] as const
type TournamentType = (typeof VALID_TYPES)[number]

export default async function TournamentTypePage({
  params,
  searchParams,
}: {
  params: { type: string }
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  if (!(VALID_TYPES as readonly string[]).includes(params.type)) {
    notFound()
  }
  const type = params.type as TournamentType

  const seasons = await listSeasons()
  if (seasons.length === 0) {
    redirect('/admin/tournaments')
  }

  const rawSeason = typeof searchParams.season === 'string' ? searchParams.season : null
  if (!rawSeason) {
    redirect(`/admin/tournaments/${type}?season=${seasons[0].id}`)
  }
  const selectedSeasonId = rawSeason

  // Use tournament date for team membership lookup; fall back to today
  const today = new Date().toISOString().split('T')[0]

  const [tournament, playersWithTeams, teams] = await Promise.all([
    getTournamentBySeasonAndType(selectedSeasonId, type),
    getPlayersWithTeams(selectedSeasonId, today),
    listTeamsBySeason(selectedSeasonId),
  ])

  return (
    <TournamentTypePageClient
      type={type}
      seasons={seasons}
      selectedSeasonId={selectedSeasonId}
      tournament={tournament}
      playersWithTeams={playersWithTeams}
      teams={teams}
    />
  )
}
