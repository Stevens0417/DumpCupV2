# Admin Forms Build Order

Admin forms must be built in the following order to reduce rework.

We build from foundational data upward.

---

## 1. Players (FOUNDATION)

Dependencies: none

Features:
- Create player
- Edit player
- Delete player
- Toggle between form + table
- Handicap validation

Must be fully working before continuing.

---

## 2. Draft / Rosters

Dependencies:
- Players
- Seasons
- Teams

Features:
- Season selector
- Assign player to team
- Undrafted players table (sorted by handicap)
- Remove player from undrafted table when drafted

---

## 3. Trades (Effective Dating)

Dependencies:
- Rosters

Features:
- Swap players between teams
- Record trade date
- Ensure historical points remain with old team

---

## 4. Match Types

Dependencies:
- None

Features:
- Match type name
- Player count per team
- Handicap allowance
- Allocation percentages per ranking position
- Validation that allocations total <= 100%

---

## 5. Matches (CORE LOGIC)

Dependencies:
- Players
- Rosters
- Match Types

Features:
- Auto-calc team handicap
- Auto-calc net score
- Auto-assign team + player points
- Override capability
- Table view (edit/delete)
- Season filter

Must be 100% correct before moving on.

---

## 6. Awards

Dependencies:
- Players
- Seasons
- Teams

Features:
- League winner form
- Award winner form
- Optional net points field

---

## 7. Tournaments

Dependencies:
- Match logic
- Players
- Rosters

Build in this order:
1) Kickoff (medal)
2) Mid-season (match style)
3) Year-end (1v1)

Must support:
- Add match / add player loop
- Poster upload
- Edit existing tournament

---

## 8. Gallery

Dependencies:
- Supabase Storage

Features:
- Upload image
- Thumbnail crop
- Drag/drop support
- Position control (top or bottom)
