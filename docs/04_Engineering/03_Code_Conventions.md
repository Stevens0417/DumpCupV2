# Code Conventions

## General Rules

- Prefer clarity over cleverness.
- Avoid magic numbers.
- Avoid implicit behavior.
- Avoid hidden side effects.
- Keep functions small and composable.

---

## Domain Layer Rules

Domain functions:
- Must not directly query database.
- Must receive all required inputs.
- Must return deterministic output.

Example:

BAD:
  function calculateHandicap(teamId)

GOOD:
  function calculateHandicap(players, allowance, weights)

---

## Database Layer Rules

- No inline SQL in UI.
- No direct Supabase usage in components.
- All queries go through /lib/db.

---

## UI Rules

- Mobile-first always.
- Reuse components.
- Avoid layout duplication.
- Bottom nav consistent across public pages.