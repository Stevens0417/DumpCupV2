# Build Strategy: Admin-First (Write Path First)

We will build the application in this order:

1) UI skeleton (public + admin routes) with minimal placeholder content
2) Authentication + admin protection
3) Admin forms first (create/edit/delete + calculations)
4) SQL views and read models stabilized
5) Public UI built last using stable views + Figma designs

Why:
Public pages are read-only reflections of data.
Admin forms create the data, enforce rules, and validate logic.
If write-path is unstable, public UI will be rewritten multiple times.

Success criteria for this strategy:
- Admin can fully operate the tournament via forms
- Data and calculations are correct
- Public pages become simple UI + read-only queries
