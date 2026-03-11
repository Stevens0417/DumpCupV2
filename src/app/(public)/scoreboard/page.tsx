import Image from 'next/image'
import Link from 'next/link'
import ScoreboardHero from '@/components/scoreboard/ScoreboardHero'
import TeamColumn, { type PlayerRow } from '@/components/scoreboard/TeamColumn'
import ScoreLineChart from '@/components/scoreboard/ScoreLineChart'
import {
  getLatestSeasonTeamScores,
  getTeamRostersBySeason,
  getWeeklyProgressionBySeason,
} from '@/lib/db/scoreboard'

export default async function ScoreboardPage() {
  const { scores, seasonId } = await getLatestSeasonTeamScores()

  const [rosterRows, weeklyData] = seasonId
    ? await Promise.all([
        getTeamRostersBySeason(seasonId),
        getWeeklyProgressionBySeason(seasonId),
      ])
    : [[], []]

  // Match teams by name (Dresden = red, York = blue)
  const dresdenScore = scores.find((s) => s.team_name.toLowerCase().includes('dresden'))
  const yorkScore = scores.find((s) => s.team_name.toLowerCase().includes('york'))

  // Build PlayerRow arrays — already ordered by display_order (captain first, then handicap asc)
  function toPlayerRows(teamId: string): PlayerRow[] {
    return rosterRows
      .filter((r) => r.team_id === teamId)
      .map((r) => ({
        name: r.player_name,
        handicap: r.player_handicap,
        isCaptain: r.is_captain,
      }))
  }

  const dresdenPlayers = dresdenScore ? toPlayerRows(dresdenScore.team_id) : []
  const yorkPlayers = yorkScore ? toPlayerRows(yorkScore.team_id) : []
  const noData = scores.length === 0

  return (
    <div className="flex flex-col min-h-full">

      {/* DUMP CUP header logo */}
      <div className="flex justify-center pt-5 pb-1 px-4">
        <Image
          src="/images/logo-header.png"
          alt="Dump Cup 2026"
          width={240}
          height={72}
          className="object-contain"
          priority
        />
      </div>

      {noData ? (
        <div className="flex-1 flex items-center justify-center px-6 py-12">
          <p className="text-gray-400 text-sm text-center">
            Season not yet started — check back soon.
          </p>
        </div>
      ) : (
        <>
          {/* Score hero — live team totals from v_team_season_scores */}
          <ScoreboardHero
            teamA={{
              name: dresdenScore?.team_name ?? 'Dresden',
              logoSrc: '/images/logo-dresden.png',
              score: dresdenScore?.total_points ?? 0,
              colorClass: 'text-red-400',
            }}
            teamB={{
              name: yorkScore?.team_name ?? 'York',
              logoSrc: '/images/logo-york.png',
              score: yorkScore?.total_points ?? 0,
              colorClass: 'text-blue-400',
            }}
          />

          <div className="mx-4 border-t border-white/10" />

          {/* Player rosters from v_team_rosters_display — captain first, then handicap asc */}
          <div className="px-4 py-3 grid grid-cols-2 gap-4">
            <TeamColumn
              teamName={dresdenScore?.team_name ?? 'Dresden'}
              colorClass="text-red-400"
              players={dresdenPlayers}
              align="left"
            />
            <TeamColumn
              teamName={yorkScore?.team_name ?? 'York'}
              colorClass="text-blue-400"
              players={yorkPlayers}
              align="right"
            />
          </div>

          <div className="mx-4 border-t border-white/10" />
        </>
      )}

      {/* Season trend chart — v_team_score_progression_weekly */}
      <div className="mx-4 mt-3">
        <div className="bg-white/5 border border-white/10 rounded-2xl h-48 px-1 pt-2 pb-1">
          <ScoreLineChart data={weeklyData} />
        </div>
        <div className="flex justify-end mt-1.5 pr-1">
          <Link href="/stats" className="text-xs text-gray-500 hover:text-gray-300 transition-colors">
            See Full Stats →
          </Link>
        </div>
      </div>

      {/* Admin entry */}
      <div className="flex justify-center px-4 py-6 mt-auto">
        <Link
          href="/admin/login"
          className="text-xs text-gray-600 hover:text-gray-400 transition-colors px-4 py-1.5 rounded border border-white/5"
        >
          Admin
        </Link>
      </div>

    </div>
  )
}
