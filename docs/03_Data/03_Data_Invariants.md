# Data Invariants (Must Never Be Violated)

1. A player cannot be on two teams at the same time within the same season.
2. A trade must not modify historical matches.
3. A match must have two distinct teams.
4. Team handicap must be >= 0.
5. Net score = Gross - Handicap.
6. Player points must sum to team points (unless explicitly overridden).
7. Tournament entries must belong to exactly one tournament.
8. Only one roster entry per player per season may have effective_to IS NULL.
9. A season must exist before teams are created.
10. A team must exist before match insertion.
