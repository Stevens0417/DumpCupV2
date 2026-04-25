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
  captain_player_id: string | null
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

export type Match = {
  id: string
  season_id: string
  match_date: string
  holes: number
  match_type_id: string
  team_a_id: string
  team_b_id: string
  team_a_handicap: number | null
  team_b_handicap: number | null
  team_a_gross: number | null
  team_b_gross: number | null
  team_a_net: number | null
  team_b_net: number | null
  team_a_points: number
  team_b_points: number
  match_points: number | null
  tournament_id: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export type MatchPlayer = {
  id: string
  match_id: string
  player_id: string
  team_id: string
  handicap_used: number | null
  points_earned: number
  created_at: string
  updated_at: string
}

export type Tournament = {
  id: string
  season_id: string
  type: 'kickoff' | 'midseason' | 'yearend'
  tournament_date: string | null
  course: string | null
  poster_url: string | null
  created_at: string
  updated_at: string
}

export type TournamentPositionPoints = {
  id: string
  tournament_id: string
  finish_position: number
  points: number
  created_at: string
  updated_at: string
}

export type TournamentEntry = {
  id: string
  tournament_id: string
  player_id: string
  team_id: string | null
  gross_score: number | null
  handicap_used: number | null
  net_score: number | null
  finish_position: number | null
  points_awarded: number | null
  created_at: string
  updated_at: string
}

export type AwardType =
  | 'league_winner'
  | 'mvp'
  | 'most_unimproved'
  | 'most_improved'
  | 'low_gross'
  | 'low_net'
  | 'other'

export type Award = {
  id: string
  season_id: string
  award: AwardType
  team_id: string | null
  team_captain: string | null
  final_score: string | null
  player_id: string | null
  net_points: number | null
  notes: string | null
  created_at: string
  updated_at: string
}

export type DerivedTrade = {
  player_id: string
  from_team_id: string
  to_team_id: string
  trade_date: string
}

export type GalleryImage = {
  id: string
  season_id: string | null
  image_url: string
  thumbnail_url: string
  position_order: number
  caption: string | null
  created_at: string
  updated_at: string
}
