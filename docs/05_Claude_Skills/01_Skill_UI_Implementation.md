# Skill: UI Implementation

Purpose:
Implement UI according to Figma prototype and mobile-first design.

---

## Design Principles

- Golf course aerial background is required.
- Dark overlay must ensure readability.
- Bottom navigation must remain fixed.
- Scoreboard is the hero element.
- Team colors:
  - Dresden = Red
  - York = Blue

---

## Background Implementation

Use:
- Full-screen background image
- Fixed positioning
- Overlay gradient (black with 40–60% opacity)
- Content layered above

Never:
- Stretch image disproportionately
- Allow text to become unreadable

---

## Scoreboard Rules

- Team names bold and branded
- Dynamic score bar proportional to points
- Scores must come from SQL view
- Line chart uses season progression view

---

## Layout Rules

Mobile first.
Avoid horizontal scroll.
Use Tailwind utility classes.
Reuse components.

---

## Prohibited

- Inline styling
- Duplicate nav bars
- Client-heavy re-render logic