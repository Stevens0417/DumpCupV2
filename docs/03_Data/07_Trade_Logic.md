# Trade Logic (Effective Dating)

Trades must preserve historical integrity.

---

When trading Player A from Team Dresden to Team York:

1. Update old roster row:
   effective_to = trade_date - 1

2. Insert new roster row:
   season_id = same
   team_id = new team
   effective_from = trade_date
   effective_to = NULL

---

When calculating match stats:

Find roster where:
  roster.player_id = X
  AND match_date BETWEEN effective_from AND effective_to

If effective_to IS NULL:
  treat as active.

---

Trades MUST NEVER:

- Modify match history
- Modify historical team totals
- Update old match records

Trades only affect future matches.
