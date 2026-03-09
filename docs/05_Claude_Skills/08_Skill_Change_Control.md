# Skill: Change Control

Purpose:
Maintain architectural integrity.

---

## If Schema Changes

1. Create migration.
2. Update schema snapshot.
3. Update relevant 03_Data doc.
4. Update Change Log.
5. Then update code.

---

## If Business Logic Changes

1. Update 03_Data.
2. Update relevant skill.
3. Update Change Log.
4. Update domain code.

---

## Never

- Modify schema silently.
- Implement logic not defined in docs.