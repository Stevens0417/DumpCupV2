'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { Tournament, Team, Season } from '@/types/database'
import type { PlayerWithTeam } from '@/lib/db/tournamentUtils'
import TournamentPanel from '../TournamentPanel'

type TournamentType = 'kickoff' | 'midseason' | 'yearend'

const TYPE_LABELS: Record<TournamentType, string> = {
  kickoff: 'Kickoff',
  midseason: 'Mid-Season',
  yearend: 'Year-End',
}

type Props = {
  type: TournamentType
  seasons: Season[]
  selectedSeasonId: string
  tournament: Tournament | null
  playersWithTeams: PlayerWithTeam[]
  teams: Team[]
}

export default function TournamentTypePageClient({
  type,
  seasons,
  selectedSeasonId,
  tournament,
  playersWithTeams,
  teams,
}: Props) {
  const router = useRouter()

  const players = playersWithTeams.map(({ team_id: _, ...p }) => p)
  const playerTeamMap: Record<string, string | null> = Object.fromEntries(
    playersWithTeams.map((p) => [p.id, p.team_id])
  )

  function handleSeasonChange(seasonId: string) {
    if (seasonId) {
      router.push(`/admin/tournaments/${type}?season=${seasonId}`)
    } else {
      router.push(`/admin/tournaments/${type}`)
    }
  }

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href={`/admin/tournaments?season=${selectedSeasonId}`}
          className="text-xs text-gray-400 hover:text-white transition-colors"
        >
          ← Tournaments
        </Link>
        <span className="text-gray-700">/</span>
        <h1 className="text-xl font-bold">{TYPE_LABELS[type]}</h1>
      </div>

      {/* Season selector */}
      <div>
        <label className="block text-xs text-gray-400 mb-1">Season</label>
        <select
          className="bg-gray-800 border border-white/20 rounded px-3 py-2 text-sm text-white w-full max-w-xs"
          value={selectedSeasonId}
          onChange={(e) => handleSeasonChange(e.target.value)}
        >
          {seasons.map((s) => (
            <option key={s.id} value={s.id}>
              {s.year}
            </option>
          ))}
        </select>
      </div>

      {/* Panel */}
      <TournamentPanel
        key={`${selectedSeasonId}-${type}-${tournament?.id ?? 'none'}`}
        tournament={tournament}
        seasonId={selectedSeasonId}
        type={type}
        players={players}
        teams={teams}
        playerTeamMap={playerTeamMap}
      />
    </div>
  )
}
