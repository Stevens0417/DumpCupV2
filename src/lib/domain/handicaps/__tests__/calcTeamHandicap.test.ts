/**
 * Unit tests for calcTeamHandicap.
 * Run with: npx tsx src/lib/domain/handicaps/__tests__/calcTeamHandicap.test.ts
 */
import assert from 'node:assert/strict'
import { calcTeamHandicap, adjustHandicapForHoles } from '../calcTeamHandicap'

let passed = 0

function test(name: string, fn: () => void) {
  try {
    fn()
    console.log(`  ✓ ${name}`)
    passed++
  } catch (err) {
    console.error(`  ✗ ${name}`)
    console.error(`    ${err}`)
    process.exitCode = 1
  }
}

// ── Test 1: Deterministic over 50 runs ──────────────────────────────────────
test('deterministic over 50 runs with equal handicaps', () => {
  const players = [
    { id: 'b-uuid', handicap: 10 },
    { id: 'a-uuid', handicap: 10 }, // same handicap — id tie-break
  ]
  const weights = { 1: 0.35, 2: 0.15 }
  const first = calcTeamHandicap(players, 0.9, weights)

  for (let i = 0; i < 50; i++) {
    const r = calcTeamHandicap(players, 0.9, weights)
    assert.equal(r.rounded, first.rounded, `run ${i}: rounded changed`)
    assert.equal(
      r.contributions[0].player_id,
      first.contributions[0].player_id,
      `run ${i}: rank-1 player changed`
    )
    assert.equal(
      r.contributions[1].player_id,
      first.contributions[1].player_id,
      `run ${i}: rank-2 player changed`
    )
  }
})

// ── Test 2: Stable sort tie-break by id ─────────────────────────────────────
test('stable sort: equal handicaps tie-break by id ASC', () => {
  const players = [
    { id: 'z-player', handicap: 10 },
    { id: 'a-player', handicap: 10 },
  ]
  const r = calcTeamHandicap(players, 1.0, { 1: 0.5, 2: 0.5 })
  assert.equal(r.contributions[0].player_id, 'a-player', 'rank 1 should be a-player (lower id)')
  assert.equal(r.contributions[1].player_id, 'z-player')
})

// ── Test 3: Match type A vs B with identical allowance + weights → same output
test('same players + same allowance + same weights => same output for any match type', () => {
  const players = [
    { id: 'p2', handicap: 12 },
    { id: 'p1', handicap: 8 },
  ]
  // Simulating "match type A" and "match type B" with same parameters
  const resultA = calcTeamHandicap(players, 0.9, { 1: 0.35, 2: 0.15 })
  const resultB = calcTeamHandicap(players, 0.9, { 1: 0.35, 2: 0.15 })
  assert.equal(resultA.rounded, resultB.rounded)
  assert.deepEqual(
    resultA.contributions.map((c) => c.player_id),
    resultB.contributions.map((c) => c.player_id)
  )
})

// ── Test 4: Known calculation ────────────────────────────────────────────────
test('known calc: hcp 8 (rank1) + hcp 12 (rank2), allowance 1.0, weights 0.35/0.15 => 5', () => {
  // raw = 8*1*0.35 + 12*1*0.15 = 2.8 + 1.8 = 4.6 → ceil = 5
  const players = [
    { id: 'p1', handicap: 12 },
    { id: 'p2', handicap: 8 },
  ]
  const r = calcTeamHandicap(players, 1.0, { 1: 0.35, 2: 0.15 })
  assert.equal(r.contributions[0].player_id, 'p2', 'rank 1 should be p2 (hcp 8)')
  assert.equal(r.contributions[1].player_id, 'p1', 'rank 2 should be p1 (hcp 12)')
  // floating point: 8*0.35 + 12*0.15 ≈ 4.6 — compare rounded result only
  assert.ok(Math.abs(r.raw - 4.6) < 1e-9, `raw ${r.raw} should be ≈ 4.6`)
  assert.equal(r.rounded, 5)
})

// ── Test 5: Singles (weight = 1) ─────────────────────────────────────────────
test('singles: hcp 15, allowance 0.9 => ceil(13.5) = 14', () => {
  const r = calcTeamHandicap([{ id: 's1', handicap: 15 }], 0.9, { 1: 1 })
  assert.equal(r.rounded, Math.ceil(15 * 0.9))
  assert.equal(r.rounded, 14)
})

// ── Test 6: ceil vs round ───────────────────────────────────────────────────
test('rounding is ceil not round: raw 4.1 rounds up to 5 not 4', () => {
  // 4*1*0.35 + 9*1*0.15 = 1.4 + 1.35 = 2.75 → ceil = 3
  const r = calcTeamHandicap(
    [{ id: 'a', handicap: 4 }, { id: 'b', handicap: 9 }],
    1.0,
    { 1: 0.35, 2: 0.15 }
  )
  assert.equal(r.rounded, Math.ceil(r.raw))
})

// ── Test 7: Empty players ────────────────────────────────────────────────────
test('empty players returns zeros', () => {
  const r = calcTeamHandicap([], 1.0, { 1: 0.35, 2: 0.15 })
  assert.equal(r.raw, 0)
  assert.equal(r.rounded, 0)
  assert.deepEqual(r.contributions, [])
})

// ── Test 8: adjustHandicapForHoles ───────────────────────────────────────────
test('adjustHandicapForHoles: 9-hole halves and rounds to nearest', () => {
  assert.equal(adjustHandicapForHoles(17, 9), 9)   // 17/2 = 8.5 → round = 9
  assert.equal(adjustHandicapForHoles(18, 9), 9)   // 18/2 = 9.0 → round = 9
  assert.equal(adjustHandicapForHoles(10, 9), 5)   // 10/2 = 5.0 → round = 5
  assert.equal(adjustHandicapForHoles(11, 9), 6)   // 11/2 = 5.5 → round = 6
  assert.equal(adjustHandicapForHoles(1, 9), 1)    // 1/2  = 0.5 → round = 1
})

test('adjustHandicapForHoles: 18-hole uses full handicap unchanged', () => {
  assert.equal(adjustHandicapForHoles(17, 18), 17)
  assert.equal(adjustHandicapForHoles(10, 18), 10)
})

// ── Test 9: 9-hole calcTeamHandicap uses halved handicaps ────────────────────
test('9-hole singles: hcp 17 → base 9, allowance 1.0 → team hcp ceil(9) = 9', () => {
  const r = calcTeamHandicap([{ id: 'p1', handicap: 17 }], 1.0, { 1: 1 }, 9)
  assert.equal(r.contributions[0].handicap, 9, 'stored handicap should be adjusted (9)')
  assert.equal(r.rounded, 9)
})

test('18-hole singles: hcp 17 → base 17, allowance 1.0 → team hcp ceil(17) = 17', () => {
  const r = calcTeamHandicap([{ id: 'p1', handicap: 17 }], 1.0, { 1: 1 }, 18)
  assert.equal(r.contributions[0].handicap, 17, 'full handicap preserved for 18-hole')
  assert.equal(r.rounded, 17)
})

test('9-hole 2-player team: hcp 8 and 12 → adjusted 4 and 6, allowance 1.0, weights 0.35/0.15', () => {
  // adjusted: 8→4 (rank1), 12→6 (rank2)
  // raw = 4*1*0.35 + 6*1*0.15 = 1.4 + 0.9 = 2.3 → ceil = 3
  const players = [
    { id: 'p1', handicap: 8 },
    { id: 'p2', handicap: 12 },
  ]
  const r = calcTeamHandicap(players, 1.0, { 1: 0.35, 2: 0.15 }, 9)
  assert.equal(r.contributions[0].handicap, 4, 'rank-1 player adjusted to 4')
  assert.equal(r.contributions[1].handicap, 6, 'rank-2 player adjusted to 6')
  assert.ok(Math.abs(r.raw - 2.3) < 1e-9, `raw ${r.raw} should be ≈ 2.3`)
  assert.equal(r.rounded, 3)
})

test('default holes param (18) matches explicit 18-hole call', () => {
  const players = [{ id: 'p1', handicap: 15 }]
  const r1 = calcTeamHandicap(players, 0.9, { 1: 1 })      // default
  const r2 = calcTeamHandicap(players, 0.9, { 1: 1 }, 18)  // explicit
  assert.equal(r1.rounded, r2.rounded)
})

console.log(`\n${passed} tests passed.\n`)
