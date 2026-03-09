// Match points calculation.
// Team handicap: delegated to calcTeamHandicap (stable, deterministic).
// Rounding rule: Math.ceil (round UP) per docs/03_Data/05_Handicap_Calculation_Rules.md

export {
  calcTeamHandicap,
  adjustHandicapForHoles,
  type PlayerForHandicap,
  type TeamHandicapResult,
} from './calcTeamHandicap'

/**
 * Determines match points for each team.
 * team_points_total = (holes / 18) * N
 * basePoints = holes / 18 (individual player points for winning team).
 * Winner gets team_points_total, loser gets 0.
 * Tie: both get team_points_total; players earn 0 (caller enforces this).
 * Uses net score if available, else gross. Lower = better (golf).
 */
export function computeMatchPoints(
  holes: number,
  N: number,
  teamANet: number | null,
  teamBNet: number | null,
  teamAGross: number | null,
  teamBGross: number | null
): { teamA: number; teamB: number; isTie: boolean; basePoints: number } {
  const basePoints = holes / 18
  const teamTotal = basePoints * N
  const aScore = teamANet ?? teamAGross ?? null
  const bScore = teamBNet ?? teamBGross ?? null

  if (aScore === null || bScore === null) {
    return { teamA: 0, teamB: 0, isTie: false, basePoints }
  }

  if (aScore < bScore) {
    return { teamA: teamTotal, teamB: 0, isTie: false, basePoints }
  } else if (bScore < aScore) {
    return { teamA: 0, teamB: teamTotal, isTie: false, basePoints }
  } else {
    return { teamA: teamTotal, teamB: teamTotal, isTie: true, basePoints }
  }
}

/**
 * Player points per winning player = basePoints (holes/18).
 * Tie or losing player = 0.
 */
export function computePlayerPoints(basePoints: number, isTie: boolean): number {
  if (isTie) return 0
  return basePoints
}
