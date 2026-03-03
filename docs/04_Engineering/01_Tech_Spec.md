# Technical Specification

## Technology Stack

Frontend:
- Next.js (App Router)
- TypeScript
- Tailwind CSS

Backend:
- Supabase (Postgres)
- Supabase Auth
- Supabase Storage

Hosting:
- Vercel

---

## Architecture Overview

This project follows a layered architecture:

UI Layer:
  /src/app
  /src/components

Domain Layer:
  /src/lib/domain

Data Access Layer:
  /src/lib/db

Infrastructure:
  /supabase
  /docs

---

## Core Engineering Principles

1. Business logic must never live in UI components.
2. All calculations must be deterministic.
3. Database queries must be centralized.
4. Schema changes must use migrations.
5. Documentation is authoritative.

---

## Rendering Strategy

Public Pages:
- Server Components by default
- Minimal client-side state

Admin Pages:
- Server actions or API routes for mutations
- Form validation required

---

## Data Flow

UI
  → Server Route / Server Component
    → Domain Layer
      → DB Layer
        → Supabase

Domain logic must execute before database mutations.
