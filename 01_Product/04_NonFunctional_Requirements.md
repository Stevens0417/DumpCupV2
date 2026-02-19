# Non-Functional Requirements

## Performance

- Page load under 2 seconds.
- Avoid unnecessary client-side heavy queries.
- Prefer server-side data fetching.

---

## Scalability

- Must support unlimited seasons.
- Must support additional match types.
- Must support additional tournament types.

---

## Maintainability

- Clear domain separation.
- All business logic isolated.
- No duplicate logic.
- No implicit side effects.

---

## Security

- Supabase RLS enabled.
- Admin whitelist enforced.
- Storage access controlled.

---

## Usability

- Mobile-first layout.
- Clear bottom navigation.
- Touch-friendly forms.
- Large tap targets.
- Minimal cognitive load.

---

## Data Integrity

- Effective dating for trades enforced.
- No historical mutation.
- Overrides tracked but not destructive.
