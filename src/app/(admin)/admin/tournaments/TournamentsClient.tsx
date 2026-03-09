'use client'

import { useRouter } from 'next/navigation'
import type { Tournament, Player, Team, Season } from '@/types/database'
import TournamentPanel from './TournamentPanel'

type TournamentType = 'kickoff' | 'midseason' | 'yearend'

const TYPES: TournamentType[] = ['kickoff', 'midseason', 'yearend']
const TYPE_LABELS: Record<TournamentType, string> = {
  kickoff: 'Kickoff',
  midseason: 'Mid-Season',
  yearend: 'Year-End',
}

type Props = {
  seasons: Season[]
  selectedSeasonId: string | null
  selectedType: TournamentType
  tournaments: Tournament[]
  players: Player[]
  teams: Team[]
}

export default function TournamentsClient({
  seasons,
  selectedSeasonId,
  selectedType,
  tournaments,
  players,
  teams,
}: Props) {
  const router = useRouter()

  const tournament = tournaments.find((t) => t.type === selectedType) ?? null

  function handleSeasonChange(seasonId: string) {
    const params = new URLSearchParams()
    if (seasonId) params.set('season', seasonId)
    params.set('type', selectedType)
    router.push(`/admin/tournaments?${params.toString()}`)
  }

  function handleTypeChange(type: TournamentType) {
    const params = new URLSearchParams()
    if (selectedSeasonId) params.set('season', selectedSeasonId)
    params.set('type', type)
    router.push(`/admin/tournaments?${params.toString()}`)
  }

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-bold">Tournaments</h1>

      {/* Season selector */}
      <div>
        <label className="block text-xs text-gray-400 mb-1">Season</label>
        <select
          className="bg-gray-800 border border-white/20 rounded px-3 py-2 text-sm text-white w-full max-w-xs"
          value={selectedSeasonId ?? ''}
          onChange={(e) => handleSeasonChange(e.target.value)}
        >
          <option value="">— select season —</option>
          {seasons.map((s) => (
            <option key={s.id} value={s.id}>
              {s.year}
            </option>
          ))}
        </select>
      </div>

      {!selectedSeasonId && (
        <p className="text-gray-400 text-sm">Select a season to manage tournaments.</p>
      )}

      {selectedSeasonId && (
        <>
          {/* Type tabs */}
          <div className="flex gap-1 border-b border-white/10">
            {TYPES.map((t) => {
              const hasTournament = tournaments.some((to) => to.type === t)
              return (
                <button
                  key={t}
                  onClick={() => handleTypeChange(t)}
                  className={`px-4 py-2 text-sm font-medium transition-colors rounded-t ${
                    selectedType === t
                      ? 'bg-gray-800 text-white border-t border-l border-r border-white/10'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {TYPE_LABELS[t]}
                  {hasTournament && (
                    <span className="ml-1.5 w-1.5 h-1.5 rounded-full bg-green-500 inline-block align-middle" />
                  )}
                </button>
              )
            })}
          </div>

          {/* Panel — key forces remount when season/type/tournament changes */}
          <TournamentPanel
            key={`${selectedSeasonId}-${selectedType}-${tournament?.id ?? 'none'}`}
            tournament={tournament}
            seasonId={selectedSeasonId}
            type={selectedType}
            players={players}
            teams={teams}
          />
        </>
      )}
    </div>
  )
}
