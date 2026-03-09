# Dump Cup – Official Build Plan

This document defines the execution roadmap for building the Dump Cup web application.

Core Strategy:
Build the write-path (admin forms + data integrity) first.
Then build the public-facing UI using stable, tested data views.

Why:
Public pages are read-only representations of data.
If write logic is unstable, public UI will require refactoring.

---

# PHASE 0 — Foundation Setup

Goal:
Project structure, Supabase setup, and documentation alignment.

## 0.1 Repository + Tooling
- Initialize Next.js (App Router) with TypeScript.
- Install Tailwind.
- Create folder structure (src/, docs/, supabase/).
- Add .env.example.
- Confirm Git workflow operational.

## 0.2 Supabase Setup
- Create Supabase project.
- Enable Auth.
- Enable Storage.
- Add environment variables:
  - NEXT_PUBLIC_SUPABASE_URL
  - NEXT_PUBLIC_SUPABASE_ANON_KEY
  - SUPABASE_SERVICE_ROLE_KEY (server only)

## 0.3 Database Initialization
- Run migration: 0001_init.sql
- Confirm all tables exist.
- Enable RLS policies.
- Confirm read access public / write access admin only.

Definition of Done:
- Database accessible.
- Migrations working.
- App boots locally.
- Docs reflect current schema.

---

# PHASE 1 — Public Shell (Layout Only)

Goal:
Establish routing, layout system, and navigation.

No real data integration yet.

## 1.1 Public Pages
Create:
- /scoreboard
- /stats
- /history
- /tournaments
- /gallery

Each page includes:
- Golf background
- Overlay
- Page title
- Placeholder content

## 1.2 Bottom Navigation
- Fixed bottom nav
- Active route highlighting
- Mobile-first spacing

## 1.3 Scoreboard Page
- Include Admin Login button at bottom
- No real data yet

Definition of Done:
- All public routes render.
- Navigation works.
- Layout stable and reusable.

---

# PHASE 2 — Authentication + Admin Shell

Goal:
Secure admin access and create admin layout shell.

## 2.1 Login Page
Route:
- /admin/login

Features:
- Supabase authentication
- Restrict access using app_admins table

## 2.2 Admin Layout
Create:
- AdminLayout
- Admin navigation (simple vertical or bottom nav)

Admin Routes:
- /admin
- /admin/players
- /admin/draft
- /admin/match-types
- /admin/matches
- /admin/awards
- /admin/tournaments
- /admin/gallery

Definition of Done:
- Admin can log in.
- Admin routes protected.
- Public cannot access admin pages.

---

# PHASE 3 — Core Admin Write Path (Data Entry Engine)

Goal:
Ensure data can be created, edited, deleted, and calculated properly.

Build in dependency order.

---

## 3.1 Players

Features:
- Create player
- Edit player
- Delete player
- Toggle table view

Definition of Done:
- Players insert into DB
- Edits persist
- Deletes confirmed
- Validation enforced

---

## 3.2 Draft / Rosters

Features:
- Select season
- Assign players to team
- Show undrafted players (via view)
- Remove drafted players from list

Definition of Done:
- Roster entries created correctly
- Undrafted view updates live

---

## 3.3 Trades

Features:
- Select one player from each team
- Choose trade date
- Apply effective dating logic

Must:
- Preserve historical integrity
- Close old roster entry
- Insert new roster entry

Definition of Done:
- Pre-trade matches remain unchanged
- Post-trade matches reflect new team

---

## 3.4 Match Types

Features:
- Create match type
- Define allowance
- Define allocation weights by rank

Validation:
- Weights must be logical
- Player count must match

Definition of Done:
- Handicap calculation inputs valid
- No invalid configurations saved

---

## 3.5 Matches (Most Critical)

Features:
- Date (default today)
- Season auto-resolve from date
- Match type selection
- Auto-render correct number of player inputs
- Auto-calc:
  - Team handicap
  - Net scores
  - Team winner
  - Player points

Allow overrides.

Definition of Done:
- Correct calculations
- Overrides work
- Edits update correctly
- Deletes remove correctly

---

## 3.6 Awards

Features:
- League winner form
- Award winner form
- Season filtering

Definition of Done:
- Award records persist correctly

---

## 3.7 Tournaments

Implement in order:

### Kickoff (Medal)
- Add players one-by-one
- Auto-calc net
- Assign positions
- Allocate points

### Midseason
- Add matches under tournament_id

### Year-End
- Head-to-head match input

Poster Upload:
- Upload to Supabase storage
- Save poster_url

Definition of Done:
- Tournament results affect team + player totals

---

## 3.8 Gallery

Features:
- Upload image
- Auto-create thumbnail
- Save image + thumbnail URL
- Order control (append top/bottom)

Definition of Done:
- Images appear correctly ordered in DB

---

# PHASE 4 — Read Model + Views Finalization

Goal:
Stabilize SQL views for public pages.

Views Required:
- v_team_totals
- v_score_progression
- v_last_match_summary
- v_player_stats_by_season
- v_player_stats_all_time
- v_awards_history
- v_tournament_results
- v_gallery_ordered

Definition of Done:
- All views return correct aggregated data
- No client-side heavy aggregation required

---

# PHASE 5 — Public UI Implementation (Figma-Based)

Goal:
Implement final UI using stable views.

---

## 5.1 Scoreboard
- Team scores from view
- Dynamic proportional score bar
- Score progression chart
- Last match summary

## 5.2 Stats
- Player stats table
- Season filter
- All-time option

## 5.3 History
- League winners
- Award winners

## 5.4 Tournaments
- Filter by season
- Display poster
- Display results

## 5.5 Gallery
- Two-column grid
- Modal full view

Definition of Done:
- No UI calculates business logic.
- All data comes from views.
- UI matches Figma intent.

---

# PHASE 6 — Polish + Hardening

- Validate edge cases
- Confirm trade integrity
- Confirm scoring accuracy
- Add loading states
- Add empty states
- Performance review
- Add missing DB indexes

---

# FINAL DEFINITION OF DONE

Public:
- All pages responsive
- Correct data displayed
- Fast and stable

Admin:
- All forms safe and validated
- Calculations accurate
- Trades historically safe

Data:
- Schema documented
- Views stable
- Change log up to date

Docs:
- Reflect current system state