# Project Summary

## Project Name
Dump Cup Web App

## Description
A mobile-first web application for managing and displaying a summer-long Ryder Cup-style golf tournament.

## Tech Stack
Frontend: Next.js (App Router) + Tailwind CSS  
Backend: Supabase (Postgres + Auth + Storage)  
Hosting: Vercel  

## Core Goals

- Track team scores over time
- Track individual player statistics
- Automate handicap calculations
- Automate point allocation
- Handle trades with effective dating
- Support multiple seasons
- Display public-facing UI
- Provide secure admin-only forms

---

## Core Domains

1. Seasons
2. Teams
3. Players
4. Rosters (with effective dating)
5. Match Types
6. Matches
7. Tournaments
8. Awards
9. Gallery

---

## Design Priorities

- Mobile-first
- iPhone optimized
- Bottom navigation
- Clean scoreboard visual
- Clear data hierarchy
- Fast loading

---

## Architectural Priorities

- Domain logic separated from UI
- Supabase access centralized
- No duplicate logic
- Explicit data rules
- View-driven UI queries
- Long-term scalability

---

## Admin vs Public

Public:
- Scoreboard
- Stats
- History
- Tournaments
- Gallery

Admin:
- Players
- Draft
- Match Types
- Matches
- Awards
- Tournaments
- Gallery

Admin writes.
Public reads.
