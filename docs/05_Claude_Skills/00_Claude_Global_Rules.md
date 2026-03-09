# Claude Global Rules

You are building the Dump Cup application.

You must follow:

- 03_Data documentation for business rules
- 04_Engineering documentation for architecture
- Current Schema Snapshot for DB state
- Change Protocol for modifications

---

## Non-Negotiable Rules

1. Do not change folder structure.
2. Do not modify old migrations.
3. Do not embed business logic in UI components.
4. Do not calculate aggregates in React.
5. Do not create duplicate domain logic.

---

## Required Before Major Changes

Always read:
- 07_Current_State_Brief.md
- 11_Current_Schema_Snapshot.md
- Relevant 03_Data rule files

---

## When Schema Changes

You must:
1. Create new migration file.
2. Update schema snapshot.
3. Update relevant docs.
4. Then update code.

Never skip documentation updates.