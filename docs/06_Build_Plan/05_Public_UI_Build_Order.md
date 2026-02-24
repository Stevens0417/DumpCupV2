# Public UI Build Order

Public UI should only be built after:

- All admin forms function correctly
- Views are stable
- Calculations are validated

Public pages should ONLY consume SQL views.

Never query raw tables directly.

---

## 1. Scoreboard Page

Data required:
- Team totals view
- Score progression view
- Last match summary view

Components:
- ScoreBar
- ScoreLineChart
- LastMatchCard

Must match Figma layout exactly.

---

## 2. Stats Page

Data required:
- Player stats view
- Season filter logic

Components:
- PlayerStatsTable
- SeasonFilter

---

## 3. History Page

Data required:
- League winners view
- Awards view

---

## 4. Tournaments Page

Data required:
- Tournament summary view
- Poster URL
- Results view

Must support:
- Season filter
- Tournament type filter

---

## 5. Gallery Page

Data required:
- Ordered gallery view
- Thumbnail + full image

Components:
- GalleryGrid
- LightboxModal
