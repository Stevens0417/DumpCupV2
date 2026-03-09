# Error Handling Strategy

## Philosophy

Errors must:
- Be explicit.
- Be traceable.
- Not silently fail.

---

## Domain Errors

Throw structured errors:

Example:
  throw new Error("Invalid allocation weights")

Never:
  return null silently.

---

## API Errors

Return structured format:

{
  success: false,
  error: "Human readable message"
}

Never expose raw DB errors to UI.

---

## Validation

All form inputs must be:
- Validated server-side.
- Schema validated (Zod recommended).

---

## Trade Validation

Reject if:
- No active roster entry exists.
- Player already traded same day.
- Season mismatch.

---

## Match Validation

Reject if:
- Same team selected twice.
- Incorrect number of players.
- Invalid handicap calculation.