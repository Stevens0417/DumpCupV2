# Product Requirements Document (PRD)

## Product Name
Dump Cup Web App

## Product Vision

The Dump Cup Web App is a mobile-first web application designed to manage, calculate, and display a summer-long Ryder Cup-style golf tournament.

It must:

- Track team performance
- Track player performance
- Automate scoring and handicap logic
- Support trades without corrupting historical data
- Support multiple seasons
- Provide a public-facing UI
- Provide secure admin-only data entry tools

---

## Core User Types

### Public User
Can:
- View scoreboard
- View stats
- View history
- View tournaments
- View gallery

Cannot:
- Modify data

### Admin User
Can:
- Create/edit/delete players
- Run draft and manage trades
- Create match types
- Enter matches
- Enter tournament results
- Assign awards
- Upload gallery images

---

## Core Features

### 1. Scoreboard
- Displays team scores
- Displays score progression over time
- Displays last match summary
- Visual score bar proportional to lead

### 2. Player Stats
- Matches played
- Wins
- Losses
- Ties
- Tournament points
- Net points
- Season filter
- All-time filter

### 3. History
- League winners
- Captains
- Final scores
- Award winners

### 4. Tournaments
- Kick Off (Medal)
- Midseason (Ryder-style)
- Year End (Head-to-head)
- Poster display
- Results display
- Season filter

### 5. Gallery
- Thumbnail grid
- Modal image view
- Ordered display
- Season-aware filtering (optional)

---

## Administrative Features

### Players Management
- Add
- Edit
- Delete
- Handicap update

### Draft & Trades
- Assign player to team
- Show undrafted players
- Handle trades with date tracking
- Maintain historical integrity

### Match Types
- Define players per team
- Define handicap allowance
- Define allocation weights by rank

### Matches
- Record gross score
- Auto-calc net score
- Auto-assign team points
- Auto-assign player points
- Manual override capability
- Edit/delete

### Tournament Entry
- Kickoff medal entry
- Position-to-points allocation
- Multi-match midseason entry
- Head-to-head year-end entry

### Awards
- League winner
- MVP
- Other awards

---

## Non-Functional Requirements

- Mobile-first design
- iPhone optimized
- Fast page load (<2s)
- Clear domain separation
- Deterministic scoring
- Secure RLS policies
- Clean architecture for future expansion

---

## Future Enhancements (Not in MVP)

- Live scoring
- Push notifications
- Player career pages
- Advanced analytics
- Animated scoreboard transitions
- Head-to-head player comparison pages
