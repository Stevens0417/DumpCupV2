# Skill: Figma Interpreter & Design Enforcement

Purpose:
Translate Figma prototypes into consistent, reusable, production-grade UI code.

Claude must treat Figma as:
- Visual specification
- Layout reference
- Design token source
- Component blueprint

Claude must NOT treat Figma as:
- Pixel-perfect copy instruction
- Static mock to hardcode

---

## Required Inputs From Figma

Claude must receive:

1. Full page screenshots (mobile viewport)
2. Component-level screenshots (nav bar, scoreboard, cards)
3. Spacing inspection details (margins/padding)
4. Font details
5. Color values
6. Layout behavior (fixed, scrollable, sticky)

---

## Design Token Extraction

From Figma, extract and define:

### Colors
Primary Red:
Primary Blue:
Accent:
Background Overlay:
Text Primary:
Text Secondary:

### Font
Heading:
Body:
Weights:

### Spacing Scale
4px / 8px / 12px / 16px / 24px etc.

Claude must define these in:
- Tailwind config
- Or CSS variables

Never hardcode hex values inline repeatedly.

## Background Handling Rule

The golf course aerial background is required across public pages.

Implementation rules:

- Use full-screen fixed background
- Add dark overlay (rgba black 40–60%)
- Content layered above
- Maintain readability at all times
- Avoid white text directly on bright turf without overlay

This must be implemented in a reusable Layout component.

## Component Extraction Strategy

Claude must break Figma pages into:

Layout Components:
- PublicLayout
- AdminLayout

Shared Components:
- BottomNav
- PageHeader
- ScoreBar
- TeamBadge
- SectionCard

Feature Components:
- ScoreboardHero
- PlayerStatsTable
- HistoryCard
- TournamentCard
- GalleryGrid

Never embed repeated layout logic inside pages.

## Scoreboard Page Rules

Scoreboard contains:

1. Tournament logo
2. Team badges
3. Dynamic score numbers
4. Dynamic proportional score bar
5. Score progression chart
6. Last match summary
7. Admin login button (conditional)

Chart must:
- Be responsive
- Use season filter
- Pull from view

Score bar must:
- Calculate width via percentage
- Animate smoothly

## Mobile Enforcement

This app is iPhone-first.

Claude must:

- Use max-width mobile container
- Avoid multi-column layouts unless necessary
- Keep touch targets ≥ 44px height
- Keep bottom nav fixed

Desktop is secondary.

## What Claude Must Ask If Missing

If Figma does not define:

- Hover behavior
- Animation timing
- Font fallback
- Tablet layout

Claude must ask before assuming.

## Update Protocol

If Figma prototype changes:

1. Update this document.
2. Update design tokens.
3. Update Change Log.
4. Refactor shared components.