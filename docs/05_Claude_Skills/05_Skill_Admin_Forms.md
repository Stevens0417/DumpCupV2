# Skill: Admin Forms

Purpose:
Build safe mutation flows.

---

## Requirements

- Server-side validation
- Zod schema validation
- Structured error returns

---

## Mutation Flow

1. Validate input.
2. Run domain calculation (if needed).
3. Execute DB mutation.
4. Revalidate relevant pages.

---

## Edit/Delete Rules

- Confirm destructive actions.
- Use soft validation before delete.
- Always update Change Log if schema impacted.