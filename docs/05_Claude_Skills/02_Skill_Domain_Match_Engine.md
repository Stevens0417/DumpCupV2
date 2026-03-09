# Skill: Match & Handicap Engine

Purpose:
Calculate team handicaps and match outcomes deterministically.

---

## Inputs Required

- Player handicaps
- Match type allowance
- Allocation weights
- Gross scores

---

## Team Handicap Algorithm

1. Sort players ascending by handicap.
2. Multiply each handicap by allowance.
3. Multiply by allocation weight.
4. Sum.
5. Round UP.

Return:
- Calculated handicap
- Rounded strokes

---

## Net Score

net = gross - handicap

---

## Points Allocation

If net_A < net_B:
  team_A wins

Default:
  1 point per 18 holes per player

Allow overrides.

---

## Constraints

- Do not query DB inside domain.
- Do not mutate inputs.
- Function must be deterministic.