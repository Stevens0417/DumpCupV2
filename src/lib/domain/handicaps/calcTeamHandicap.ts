// Pure, deterministic team handicap calculation.
// Rounding rule: Math.ceil (round UP) — see docs/03_Data/05_Handicap_Calculation_Rules.md

export type PlayerForHandicap = {
  id: string
  handicap: number
}

export type ContributionRow = {
  player_id: string
  handicap: number  // adjusted handicap (halved for 9-hole matches)
  rank: number // 1 = lowest handicap on team
  weight: number
  contribution: number // handicap * allowance * weight
}

export type TeamHandicapResult = {
  raw: number
  rounded: number // Math.ceil(raw)
  contributions: ContributionRow[]
}

/**
 * For 9-hole matches each player's base handicap is halved (rounded to nearest).
 * 18-hole and all other counts use the full handicap.
 */
export function adjustHandicapForHoles(handicap: number, holes: number): number {
  if (holes === 9) return Math.round(handicap / 2)
  return handicap
}

/**
 * Computes a team's handicap deterministically.
 *
 * Sort order: handicap ASC; tie-break by player id ASC (stable).
 * Rank 1 = lowest handicap player.
 * weightsByRank: { 1: 0.35, 2: 0.15 } etc.
 *   For singles with no allocations, pass { 1: 1 }.
 * holes: pass 9 to apply the half-handicap rule before all other calculations.
 */
export function calcTeamHandicap(
  players: PlayerForHandicap[],
  allowance: number,
  weightsByRank: Record<number, number>,
  holes = 18
): TeamHandicapResult {
  if (players.length === 0) {
    return { raw: 0, rounded: 0, contributions: [] }
  }

  // Apply 9-hole half-handicap adjustment before sorting and weighting
  const adjusted = players.map((p) => ({
    ...p,
    handicap: adjustHandicapForHoles(p.handicap, holes),
  }))

  // Stable sort: handicap ASC, then id ASC on equal handicaps
  const sorted = [...adjusted].sort((a, b) => {
    if (a.handicap !== b.handicap) return a.handicap - b.handicap
    return a.id < b.id ? -1 : a.id > b.id ? 1 : 0
  })

  const contributions: ContributionRow[] = sorted.map((p, i) => {
    const rank = i + 1
    const weight = weightsByRank[rank] ?? 0
    const contribution = p.handicap * allowance * weight
    return { player_id: p.id, handicap: p.handicap, rank, weight, contribution }
  })

  const raw = contributions.reduce((sum, c) => sum + c.contribution, 0)
  const rounded = Math.ceil(raw)

  return { raw, rounded, contributions }
}
