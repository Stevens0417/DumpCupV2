# Folder Structure

## /src/app
Routing and page entry points only.
No business logic.

## /src/components
Reusable UI components.
No Supabase calls.
No domain calculations.

## /src/lib/domain
All business logic:
- Handicap calculation
- Trade logic
- Point allocation
- Season resolution

Domain functions must be pure when possible.

## /src/lib/db
All Supabase queries and mutations.
No UI code.

## /src/types
Shared TypeScript types.

## /supabase/migrations
Database changes only.
Never edit old migration files.

---

## Naming Conventions

Components:
  PascalCase.tsx

Functions:
  camelCase.ts

Hooks:
  useCamelCase.ts

DB Queries:
  getX
  createX
  updateX
  deleteX

Views:
  v_entity_description