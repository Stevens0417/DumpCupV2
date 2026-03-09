# Skill: Trade System

Purpose:
Ensure historical integrity with effective dating.

---

## Trade Logic

When trading:

1. Update old roster:
   effective_to = trade_date - 1

2. Insert new roster:
   effective_from = trade_date
   effective_to = NULL

---

## Validation

Reject if:
- No active roster exists.
- Trade date before season start.
- Duplicate trade same day.

---

## Match Lookup Rule

When calculating team totals:

Find roster where:
  match_date BETWEEN effective_from AND effective_to

If effective_to NULL:
  treat as active.

---

## Never

- Update historical matches
- Change team_id on past records