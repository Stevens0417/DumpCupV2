import { redirect } from 'next/navigation'
import { listSeasons } from '@/lib/db/seasons'
import { listTournamentsBySeason } from '@/lib/db/tournaments'
import TournamentSelectorClient from './TournamentSelectorClient'

export default async function AdminTournamentsPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  const seasons = await listSeasons()

  const rawSeason = typeof searchParams.season === 'string' ? searchParams.season : null
  if (!rawSeason && seasons.length > 0) {
    redirect(`/admin/tournaments?season=${seasons[0].id}`)
  }
  const selectedSeasonId = rawSeason

  const tournaments = selectedSeasonId ? await listTournamentsBySeason(selectedSeasonId) : []

  return (
    <TournamentSelectorClient
      seasons={seasons}
      selectedSeasonId={selectedSeasonId}
      tournaments={tournaments}
    />
  )
}
