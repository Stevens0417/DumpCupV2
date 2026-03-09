# Test Strategy

## Manual Test Scenarios

### Handicap Calculation
Given known inputs,
Verify correct rounding and weighting.

### Trade Scenario
1. Insert match before trade.
2. Trade player.
3. Insert match after trade.
4. Verify team totals correct.

### Tournament Medal
Assign positive and negative points.
Verify team and player totals.

### Override Scenario
Override handicap.
Confirm recalculated net score correct.

---

## Future Automation

Add:
- Unit tests for domain layer.
- Integration tests for scoring engine.
- Migration validation tests.