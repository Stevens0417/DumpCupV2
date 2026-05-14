import type {
  KickoffResultRow,
  KickoffParticipantRow,
  PositionPointsPublicRow,
  TournamentMatchResultRow,
  TournamentMatchPlayerRow,
} from '@/lib/db/tournaments'

function fmt(n: number | null | undefined): string {
  if (n == null) return '—'
  return Number.isInteger(n) ? String(n) : n.toFixed(1)
}

// ── Kickoff setup (pre-results) ───────────────────────────────────────────────

function KickoffSetupTable({
  participants,
  positionPoints,
}: {
  participants: KickoffParticipantRow[]
  positionPoints: PositionPointsPublicRow[]
}) {
  return (
    <div className="space-y-5">
      {/* Participating players */}
      <div>
        <h3 className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2">
          Competing Players
        </h3>
        {participants.length === 0 ? (
          <p className="text-xs text-gray-500 py-3 text-center">
            Players will be announced soon.
          </p>
        ) : (
          <table className="w-full text-xs min-w-[240px]">
            <thead>
              <tr className="text-gray-500 border-b border-white/10">
                <th className="text-left py-2 pr-2 font-medium">Player</th>
                <th className="text-left py-2 pr-2 font-medium">Team</th>
                <th className="text-right py-2 font-medium w-12">HCP</th>
              </tr>
            </thead>
            <tbody>
              {[...participants]
                .sort((a, b) => a.player_name.localeCompare(b.player_name))
                .map((p) => (
                  <tr key={p.player_id} className="border-b border-white/5 last:border-0">
                    <td className="py-2 pr-2 text-white font-medium">{p.player_name}</td>
                    <td className="py-2 pr-2 text-gray-400">{p.team_name ?? '—'}</td>
                    <td className="py-2 text-right text-gray-400 tabular-nums">{p.handicap}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Position points */}
      {positionPoints.length > 0 && (
        <div>
          <h3 className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Points Available
          </h3>
          <div className="grid grid-cols-2 gap-1">
            {positionPoints.map((pp) => (
              <div
                key={pp.finish_position}
                className="flex justify-between text-xs px-2.5 py-1.5 bg-white/5 rounded"
              >
                <span className="text-gray-400">Position {pp.finish_position}</span>
                <span className="text-white font-semibold tabular-nums">{pp.points} pts</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Kickoff leaderboard ───────────────────────────────────────────────────────

function KickoffTable({ rows }: { rows: KickoffResultRow[] }) {
  if (rows.length === 0) {
    return <p className="text-xs text-gray-500 py-4 text-center">No results yet</p>
  }
  return (
    <div className="overflow-x-auto -mx-1">
      <table className="w-full text-xs min-w-[320px]">
        <thead>
          <tr className="text-gray-500 border-b border-white/10">
            <th className="text-left py-2 pr-2 pl-1 font-medium w-6">#</th>
            <th className="text-left py-2 pr-2 font-medium">Player</th>
            <th className="text-left py-2 pr-2 font-medium">Team</th>
            <th className="text-right py-2 pr-2 font-medium w-10">Net</th>
            <th className="text-right py-2 pr-2 font-medium w-12">Gross</th>
            <th className="text-right py-2 pr-1 font-medium w-10">Pts</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.player_id} className="border-b border-white/5 last:border-0">
              <td className="py-2 pr-2 pl-1 text-gray-500 tabular-nums">{row.display_rank}</td>
              <td className="py-2 pr-2 text-white font-medium">{row.player_name}</td>
              <td className="py-2 pr-2 text-gray-400">{row.team_name}</td>
              <td className="py-2 pr-2 text-right text-white tabular-nums font-semibold">
                {fmt(row.net_score)}
              </td>
              <td className="py-2 pr-2 text-right text-gray-400 tabular-nums">
                {fmt(row.gross_score)}
              </td>
              <td className="py-2 pr-1 text-right text-white tabular-nums">
                {fmt(row.points_awarded)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ── Match cards ───────────────────────────────────────────────────────────────

function MatchCards({
  matchResults,
  matchPlayers,
}: {
  matchResults: TournamentMatchResultRow[]
  matchPlayers: TournamentMatchPlayerRow[]
}) {
  if (matchResults.length === 0) {
    return <p className="text-xs text-gray-500 py-4 text-center">No results yet</p>
  }

  const playersByMatch = new Map<string, TournamentMatchPlayerRow[]>()
  for (const p of matchPlayers) {
    if (!playersByMatch.has(p.match_id)) playersByMatch.set(p.match_id, [])
    playersByMatch.get(p.match_id)!.push(p)
  }

  return (
    <div className="space-y-3">
      {matchResults.map((match) => {
        const players = playersByMatch.get(match.match_id) ?? []
        const teamAPlayers = players.filter((p) => p.team_id === match.team_a_id)
        const teamBPlayers = players.filter((p) => p.team_id === match.team_b_id)

        return (
          <div
            key={match.match_id}
            className="bg-white/5 rounded-xl border border-white/10 overflow-hidden"
          >
            {/* Match header */}
            <div className="px-3 py-2 border-b border-white/10 flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-200">{match.match_type_name}</span>
              {match.holes != null && (
                <span className="text-xs text-gray-500">{match.holes}H</span>
              )}
            </div>

            {/* Team score grid */}
            <div className="px-3 py-2">
              <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-x-3 text-xs mb-1">
                <span />
                <span className="text-gray-500 text-right font-medium w-8">Hcp</span>
                <span className="text-gray-500 text-right font-medium w-8">Grs</span>
                <span className="text-gray-500 text-right font-medium w-8">Net</span>
                <span className="text-gray-500 text-right font-medium w-8">Pts</span>
              </div>

              {/* Team A */}
              <div
                className={`grid grid-cols-[1fr_auto_auto_auto_auto] gap-x-3 text-xs py-1 ${
                  match.winner_name === match.team_a_name ? 'text-white' : 'text-gray-400'
                }`}
              >
                <span className="font-medium truncate flex items-center gap-1">
                  {match.team_a_name}
                  {match.winner_name === match.team_a_name && (
                    <span className="text-[9px] font-semibold text-green-400 uppercase tracking-wider">
                      W
                    </span>
                  )}
                </span>
                <span className="text-right tabular-nums w-8">{fmt(match.team_a_handicap)}</span>
                <span className="text-right tabular-nums w-8">{fmt(match.team_a_gross)}</span>
                <span className="text-right tabular-nums font-semibold w-8">
                  {fmt(match.team_a_net)}
                </span>
                <span className="text-right tabular-nums w-8">{fmt(match.team_a_points)}</span>
              </div>

              {/* Team B */}
              <div
                className={`grid grid-cols-[1fr_auto_auto_auto_auto] gap-x-3 text-xs py-1 ${
                  match.winner_name === match.team_b_name ? 'text-white' : 'text-gray-400'
                }`}
              >
                <span className="font-medium truncate flex items-center gap-1">
                  {match.team_b_name}
                  {match.winner_name === match.team_b_name && (
                    <span className="text-[9px] font-semibold text-green-400 uppercase tracking-wider">
                      W
                    </span>
                  )}
                </span>
                <span className="text-right tabular-nums w-8">{fmt(match.team_b_handicap)}</span>
                <span className="text-right tabular-nums w-8">{fmt(match.team_b_gross)}</span>
                <span className="text-right tabular-nums font-semibold w-8">
                  {fmt(match.team_b_net)}
                </span>
                <span className="text-right tabular-nums w-8">{fmt(match.team_b_points)}</span>
              </div>

              {match.winner_name === 'Tie' && (
                <p className="text-xs text-gray-500 mt-0.5">Tie</p>
              )}
            </div>

            {/* Player rows */}
            {players.length > 0 && (
              <div className="px-3 pb-2 border-t border-white/5 pt-2 space-y-2">
                {[
                  { name: match.team_a_name, ps: teamAPlayers },
                  { name: match.team_b_name, ps: teamBPlayers },
                ].map(({ name, ps }) =>
                  ps.length === 0 ? null : (
                    <div key={name}>
                      <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
                        {name}
                      </p>
                      {ps.map((p) => (
                        <div key={p.player_id} className="flex justify-between text-xs py-0.5">
                          <span className="text-gray-300">{p.player_name}</span>
                          <div className="flex gap-3 text-gray-500">
                            <span>Hcp {fmt(p.handicap_used)}</span>
                            <span>Pts {fmt(p.points_earned)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ),
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── Public export ─────────────────────────────────────────────────────────────

type Props = {
  tournamentType: 'kickoff' | 'midseason' | 'yearend'
  tournamentStatus: string
  kickoffRows: KickoffResultRow[]
  kickoffParticipants: KickoffParticipantRow[]
  positionPoints: PositionPointsPublicRow[]
  matchResults: TournamentMatchResultRow[]
  matchPlayers: TournamentMatchPlayerRow[]
}

export default function ResultsTable({
  tournamentType,
  tournamentStatus,
  kickoffRows,
  kickoffParticipants,
  positionPoints,
  matchResults,
  matchPlayers,
}: Props) {
  const isSetup = tournamentType === 'kickoff' && tournamentStatus === 'setup'
  const heading = isSetup ? 'Tournament Preview' : 'Results'

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
      <div className="px-4 py-3 border-b border-white/10">
        <h2 className="text-sm font-semibold text-gray-200">{heading}</h2>
      </div>
      <div className="p-4">
        {isSetup ? (
          <KickoffSetupTable participants={kickoffParticipants} positionPoints={positionPoints} />
        ) : tournamentType === 'kickoff' ? (
          <KickoffTable rows={kickoffRows} />
        ) : (
          <MatchCards matchResults={matchResults} matchPlayers={matchPlayers} />
        )}
      </div>
    </div>
  )
}
