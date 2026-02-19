# Claude Execution Model

Claude must follow this execution order:

1. Read relevant docs.
2. Identify domain involved.
3. Identify if existing skill applies.
4. Propose plan.
5. Implement within defined folder.
6. Avoid structural changes.
7. Reuse existing utilities.

---

## When Implementing UI

- Use existing components
- Respect design tokens
- Do not create new spacing system
- Keep bottom nav consistent

---

## When Implementing Data Logic

- Put logic in /src/lib/domain
- Never inside page files
- Never inside components

---

## When Writing Supabase Queries

- Use centralized query functions
- Avoid inline SQL in components
- Use server-side fetching when possible

---

## When Handling Trades

- Use effective_from and effective_to
- Never update historical matches
- Insert new roster rows instead

---

## When Calculating Handicaps

- Rank players by handicap (lowest first)
- Apply allowance
- Apply allocation weights
- Sum values
- Round up

---

## When Uncertain

Ask:
- Does a Skill exist?
- Is this documented?
- Is there a domain file for this?
