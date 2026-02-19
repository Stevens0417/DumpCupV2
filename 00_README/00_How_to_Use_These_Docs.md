# How to Use These Docs

This documentation folder exists to give Claude (and future developers) complete context before writing code.

Before generating or modifying any code, Claude MUST read:

1. /docs/00_README/01_Project_Summary.md
2. /docs/01_Product/01_PRD.md
3. /docs/02_UX_UI/04_Design_Tokens.md
4. /docs/03_Data/06_Data_Rules.md
5. Relevant file inside /docs/05_Claude_Skills/

Claude must treat this documentation as the source of truth.

---

## Rules for Claude

1. Do NOT invent new architecture if structure is already defined.
2. Do NOT modify folder structure without explicit instruction.
3. Follow domain separation rules.
4. All business logic must live in `/src/lib/domain`.
5. All database queries must live in `/src/lib/db`.
6. UI must reuse components when possible.
7. Mobile-first design is mandatory.
8. Never duplicate logic across files.
9. Never embed SQL in UI components.
10. If unsure, refer to documentation before guessing.

---

## Development Philosophy

This project is documentation-first.

Architecture is defined BEFORE implementation.

Claude executes within defined boundaries.

---

## When Adding Features

Before writing code:
1. Update PRD if needed.
2. Update Data Rules if schema changes.
3. Update Skills if logic patterns change.
4. Then implement.

Documentation drives implementation — not the other way around.
