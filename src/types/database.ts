export type Player = {
  id: string
  full_name: string
  handicap: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export type Season = {
  id: string
  year: number
  created_at: string
  updated_at: string
}

export type Team = {
  id: string
  season_id: string
  name: string
  captain_name: string | null
  color_primary: string | null
  color_secondary: string | null
  created_at: string
  updated_at: string
}

export type Roster = {
  id: string
  season_id: string
  team_id: string
  player_id: string
  handicap_at_draft: number | null
  drafted_at: string | null
  effective_from: string
  effective_to: string | null
  is_celebrity: boolean
  created_at: string
  updated_at: string
}

export type MatchType = {
  id: string
  name: string
  players_per_team: number
  handicap_allowance: number
  notes: string | null
  created_at: string
  updated_at: string
}

export type MatchTypeAllocation = {
  id: string
  match_type_id: string
  rank_order: number
  percentage_weight: number
  created_at: string
  updated_at: string
}
