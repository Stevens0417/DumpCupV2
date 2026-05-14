'use client'

import { useState, useMemo } from 'react'
import type {
  TournamentSummaryRow,
  KickoffResultRow,
  KickoffParticipantRow,
  PositionPointsPublicRow,
  TournamentMatchResultRow,
  TournamentMatchPlayerRow,
} from '@/lib/db/tournaments'
import PosterCard from './PosterCard'
import ResultsTable from './ResultsTable'

type TournamentType = 'kickoff' | 'midseason' | 'yearend'

const TYPE_LABELS: Record<TournamentType, string> = {
  kickoff: 'Kickoff',
  midseason: 'Midseason',
  yearend: 'Year-End',
}

const ALL_TYPES: TournamentType[] = ['kickoff', 'midseason', 'yearend']

const TYPE_PRIORITY: Record<TournamentType, number> = {
  yearend: 0,
  midseason: 1,
  kickoff: 2,
}

function latestFirst(
  a: { tournament_date: string | null; tournament_type: TournamentType },
  b: { tournament_date: string | null; tournament_type: TournamentType },
): number {
  const dateCmp = (b.tournament_date ?? '').localeCompare(a.tournament_date ?? '')
  return dateCmp !== 0 ? dateCmp : TYPE_PRIORITY[a.tournament_type] - TYPE_PRIORITY[b.tournament_type]
}

type TournamentMeta = {
  tournament_id: string
  season_year: number
  tournament_type: TournamentType
  tournament_date: string | null
  course: string | null
  poster_url: string | null
  teamPoints: { team_name: string; team_points: number }[]
}

type Props = {
  summaries: TournamentSummaryRow[]
  kickoffRows: KickoffResultRow[]
  kickoffParticipants: KickoffParticipantRow[]
  positionPointsRows: PositionPointsPublicRow[]
  tournamentStatuses: Record<string, string>
  matchResults: TournamentMatchResultRow[]
  matchPlayers: TournamentMatchPlayerRow[]
  seasonYears: number[]
}

export default function TournamentsFilter({
  summaries,
  kickoffRows,
  kickoffParticipants,
  positionPointsRows,
  tournamentStatuses,
  matchResults,
  matchPlayers,
  seasonYears,
}: Props) {
  const [selectedYear, setSelectedYear] = useState<number>(() => {
    const sorted = [...summaries].sort(latestFirst)
    return sorted[0]?.season_year ?? (seasonYears[0] ?? new Date().getFullYear())
  })

  const [selectedType, setSelectedType] = useState<TournamentType>(() => {
    const sorted = [...summaries].sort(latestFirst)
    return sorted[0]?.tournament_type ?? 'yearend'
  })

  const tournamentMeta = useMemo(() => {
    const map = new Map<string, TournamentMeta>()
    for (const row of summaries) {
      if (!map.has(row.tournament_id)) {
        map.set(row.tournament_id, {
          tournament_id: row.tournament_id,
          season_year: row.season_year,
          tournament_type: row.tournament_type,
          tournament_date: row.tournament_date,
          course: row.course,
          poster_url: row.poster_url,
          teamPoints: [],
        })
      }
      map.get(row.tournament_id)!.teamPoints.push({
        team_name: row.team_name,
        team_points: row.team_points,
      })
    }
    return map
  }, [summaries])

  const typesForYear = useMemo(() => {
    const set = new Set<TournamentType>()
    for (const meta of tournamentMeta.values()) {
      if (meta.season_year === selectedYear) set.add(meta.tournament_type)
    }
    return set
  }, [tournamentMeta, selectedYear])

  function handleYearChange(year: number) {
    setSelectedYear(year)
    const typesInYear = [...tournamentMeta.values()]
      .filter((m) => m.season_year === year)
      .map((m) => m.tournament_type)
    if (!typesInYear.includes(selectedType)) {
      const latest = [...tournamentMeta.values()]
        .filter((m) => m.season_year === year)
        .sort(latestFirst)
      if (latest.length > 0) setSelectedType(latest[0].tournament_type)
    }
  }

  const selectedTournament = useMemo(() => {
    for (const meta of tournamentMeta.values()) {
      if (meta.season_year === selectedYear && meta.tournament_type === selectedType) return meta
    }
    return null
  }, [tournamentMeta, selectedYear, selectedType])

  const selectedStatus = selectedTournament
    ? (tournamentStatuses[selectedTournament.tournament_id] ?? 'complete')
    : 'complete'

  const filteredKickoffRows = useMemo(() => {
    if (!selectedTournament || selectedType !== 'kickoff') return []
    return kickoffRows.filter((r) => r.tournament_id === selectedTournament.tournament_id)
  }, [kickoffRows, selectedTournament, selectedType])

  const filteredParticipants = useMemo(() => {
    if (!selectedTournament || selectedType !== 'kickoff') return []
    return kickoffParticipants.filter((p) => p.tournament_id === selectedTournament.tournament_id)
  }, [kickoffParticipants, selectedTournament, selectedType])

  const filteredPositionPoints = useMemo(() => {
    if (!selectedTournament) return []
    return positionPointsRows.filter((p) => p.tournament_id === selectedTournament.tournament_id)
  }, [positionPointsRows, selectedTournament])

  const filteredMatchResults = useMemo(() => {
    if (!selectedTournament || selectedType === 'kickoff') return []
    return matchResults.filter((r) => r.tournament_id === selectedTournament.tournament_id)
  }, [matchResults, selectedTournament, selectedType])

  const filteredMatchPlayers = useMemo(() => {
    if (!selectedTournament || selectedType === 'kickoff') return []
    return matchPlayers.filter((r) => r.tournament_id === selectedTournament.tournament_id)
  }, [matchPlayers, selectedTournament, selectedType])

  if (seasonYears.length === 0) {
    return (
      <div className="px-4 py-12 text-center text-gray-500 text-sm">
        No tournaments available yet.
      </div>
    )
  }

  return (
    <div className="px-4 space-y-3 mt-2">
      {/* Year filter */}
      <div className="flex gap-1.5 flex-wrap">
        {seasonYears.map((year) => (
          <button
            key={year}
            onClick={() => handleYearChange(year)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              selectedYear === year
                ? 'bg-white/20 border-white/30 text-white'
                : 'border-white/10 text-gray-400 hover:bg-white/10 hover:text-gray-200'
            }`}
          >
            {year}
          </button>
        ))}
      </div>

      {/* Tournament type filter */}
      <div className="flex gap-1.5 flex-wrap">
        {ALL_TYPES.map((type) => {
          const available = typesForYear.has(type)
          return (
            <button
              key={type}
              onClick={() => available && setSelectedType(type)}
              disabled={!available}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                selectedType === type && available
                  ? 'bg-white/20 border-white/30 text-white'
                  : available
                    ? 'border-white/10 text-gray-400 hover:bg-white/10 hover:text-gray-200'
                    : 'border-white/5 text-gray-600 cursor-not-allowed'
              }`}
            >
              {TYPE_LABELS[type]}
            </button>
          )
        })}
      </div>

      {/* Tournament content */}
      {!selectedTournament ? (
        <div className="text-center py-10 text-gray-500 text-sm">
          No {TYPE_LABELS[selectedType]} tournament found for {selectedYear}.
        </div>
      ) : (
        <div className="space-y-3 pb-4">
          <PosterCard
            posterUrl={selectedTournament.poster_url}
            course={selectedTournament.course}
            tournamentDate={selectedTournament.tournament_date}
            tournamentType={selectedTournament.tournament_type}
            year={selectedTournament.season_year}
            teamPoints={selectedTournament.teamPoints}
          />
          <ResultsTable
            tournamentType={selectedType}
            tournamentStatus={selectedStatus}
            kickoffRows={filteredKickoffRows}
            kickoffParticipants={filteredParticipants}
            positionPoints={filteredPositionPoints}
            matchResults={filteredMatchResults}
            matchPlayers={filteredMatchPlayers}
          />
        </div>
      )}
    </div>
  )
}
