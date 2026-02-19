# Project Principles

## 1. Architecture First
Folder structure and domain boundaries are defined before coding.

## 2. Separation of Concerns
UI != Domain Logic != Data Access != Database

## 3. Deterministic Scoring
All scoring logic must be:
- Explicit
- Reproducible
- Documented
- Tested

## 4. Effective Dating Integrity
Trades must NEVER alter historical results.

## 5. Override Control
Admin may override:
- Handicap
- Points
- Net score

But overrides must never corrupt totals.

## 6. Reusability
Components must be reusable.
Domain logic must be reusable.
Skills must be reusable.

## 7. No Hidden Logic
All logic must be in domain files.
No implicit behavior.

## 8. Mobile First Always
All UI decisions default to mobile optimization.

## 9. Views > Complex Client Queries
Heavy calculations should be done via:
- SQL views
- Domain functions

Not large client-side transformations.

## 10. Documentation is Mandatory
If logic changes, documentation changes.
