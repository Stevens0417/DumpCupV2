import PageHeader from '@/components/layout/PageHeader'
import TournamentsFilter from '@/components/tournaments/TournamentsFilter'
import {
  getTournamentSummaryAllSeasons,
  getKickoffResultsAllSeasons,
  getTournamentMatchResultsAllSeasons,
  getTournamentMatchPlayersAllSeasons,
} from '@/lib/db/tournaments'

export default async function TournamentsPage() {
  const [summaries, kickoffRows, matchResults, matchPlayers] = await Promise.all([
    getTournamentSummaryAllSeasons(),
    getKickoffResultsAllSeasons(),
    getTournamentMatchResultsAllSeasons(),
    getTournamentMatchPlayersAllSeasons(),
  ])

  const seasonYears = [...new Set(summaries.map((r) => r.season_year))].sort((a, b) => b - a)

  return (
    <div className="pb-4">
      <PageHeader title="Tournaments" subtitle="Season events and results" />
      <TournamentsFilter
        summaries={summaries}
        kickoffRows={kickoffRows}
        matchResults={matchResults}
        matchPlayers={matchPlayers}
        seasonYears={seasonYears}
      />
    </div>
  )
}
