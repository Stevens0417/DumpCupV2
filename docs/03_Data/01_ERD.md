# Entity Relationship Overview (ERD)

This document describes the logical data relationships.

---

## Core Entities

Season
  ├── Teams
  │     └── Rosters (players assigned to teams)
  │
  ├── Matches
  │     └── Match Players
  │
  ├── Tournaments
  │     ├── Tournament Entries (Kickoff medal)
  │     └── Matches (Midseason / Yearend)
  │
  └── Awards

Players exist independently of seasons.

Rosters link:
  Player → Team → Season

Matches link:
  Team A ↔ Team B
  Match Players → Player

Trades are handled via:
  rosters.effective_from
  rosters.effective_to

Historical integrity depends on this effective dating model.
