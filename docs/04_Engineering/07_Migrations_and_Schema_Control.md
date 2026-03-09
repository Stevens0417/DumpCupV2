# Migrations & Schema Control

## Rules

1. Never modify old migrations.
2. Every schema change requires a new migration.
3. Migration filenames must be chronological.

Example:

0001_init.sql
0002_add_views.sql
0003_add_trade_index.sql

---

## After Migration

1. Update:
   - 03_Data docs
   - Current Schema Snapshot
   - Change Log

2. Commit changes.

---

## Schema Drift Prevention

Schema changes must follow:

Docs → Migration → Code