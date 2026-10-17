# Rosary Companion — Domain Model Spec

Target for the first Claude Code session. Implement `src/domain/rosary.ts`
against `src/domain/types.ts` with full Jest coverage. **No React, Three.js,
or Expo imports anywhere in `src/domain/`.**

## 1. Core idea: beads vs stops

Two separate concepts — do not merge them:

- **PhysicalBead** — an element of the 3D model (59 beads + crucifix + medal).
  Fixed, identical for every session. `id` matches the glTF node name.
- **Stop** — one prayer in the playback sequence. There are MORE stops than
  beads, because several prayers happen on the same physical bead.

Tapping a bead in the 3D scene → look up `firstStopByBead[beadId]` → jump.

## 2. Physical bead list (chain order)

```
crucifix
opening_large_1
opening_small_1
opening_small_2
opening_small_3
medal
decade_1_large
decade_1_small_1 ... decade_1_small_10
decade_2_large
decade_2_small_1 ... decade_2_small_10
decade_3_large
... (through decade_5_small_10)
```

Total: 1 crucifix + 1 medal + 6 large + 53 small = 61 elements.
(The medal is where the closing prayers are said.)

## 3. Stop sequence

Given a `MysterySet` (e.g. `"sorrowful"`), `buildSequence` returns exactly
this, in order:

| # | prayerKey | beadId |
|---|-----------|--------|
| Opening | | |
| 1 | sign_of_cross | crucifix |
| 2 | apostles_creed | crucifix |
| 3 | our_father | opening_large_1 |
| 4–6 | hail_mary ×3 | opening_small_1..3 (hailMaryNumber 1..3) |
| 7 | glory_be | opening_small_3 |
| Decade d (repeat for d = 1..5) | | |
| · | {set}_{d} (announcement) | decade_d_large |
| · | our_father | decade_d_large |
| · | hail_mary ×10 | decade_d_small_1..10 (hailMaryNumber 1..10, decade d) |
| · | glory_be | decade_d_small_10 |
| · | fatima_prayer | decade_d_small_10 |
| Closing | | |
| · | hail_holy_queen | medal |
| · | closing_prayer | medal |
| · | sign_of_cross | medal |

Total stops: 7 + 5×14 + 3 = **80**. Assert this in tests.

Notes:
- Every stop inside a decade carries `decade: d`.
- `glory_be` + `fatima_prayer` are prayed on the chain after the 10th bead;
  we attach them to `decade_d_small_10` so highlighting stays sensible.
- The sequence structure is IDENTICAL across mystery sets — only the five
  announcement prayerKeys differ.

## 4. Mystery of the day

| Day | Set |
|-----|-----|
| Monday, Saturday | joyful |
| Tuesday, Friday | sorrowful |
| Wednesday, Sunday | glorious |
| Thursday | luminous |

`mysteryOfTheDay(date)` uses the device's local date. User can override in UI;
the override lives in the store, not the domain.

## 5. State transitions

- `advance(state)`: `currentStopIndex + 1`, clamped at last stop. When clamped
  (already at end), also set `isPlaying: false`.
- `jumpToBead(state, beadId)`: set `currentStopIndex` to
  `firstStopByBead[beadId]`; unknown beadId → return state unchanged.
- Both are pure: return new objects, never mutate.

## 6. Content file invariants (write a validation test)

For each language file `assets/prayers/{lang}.json`:
- Every `PrayerKey` used by `buildSequence` exists in the file.
- No empty `lines` arrays.

For each `audio/{lang}/timings.json` (once audio exists):
- Every key present in the prayer file has a timing entry.
- `lineStartsMs.length === lines.length` for that prayer.
- `lineStartsMs` is strictly increasing and `< durationMs`.

## 7. Audio file naming contract

```
assets/audio/{lang}/{prayerKey}.m4a     e.g. assets/audio/en/hail_mary.m4a
assets/audio/{lang}/timings.json
```

One file per prayer (not one per stop) — the Hail Mary is recorded once and
played 53 times. Mono, 64 kbps AAC or Opus.

## 8. Suggested first Claude Code prompt

> Read docs/DOMAIN_SPEC.md and src/domain/types.ts. Implement
> src/domain/rosary.ts exporting buildBeads, buildSequence, mysteryOfTheDay,
> advance, and jumpToBead exactly per the spec. Then write Jest tests
> covering: total stop count is 80, bead count is 61, firstStopByBead is
> consistent with stops, all four mystery sets produce valid sequences,
> mysteryOfTheDay for all 7 weekdays, advance clamps at the end and flips
> isPlaying, jumpToBead handles unknown ids. Also add a content validation
> test that loads assets/prayers/en.json and asserts every prayerKey used by
> buildSequence exists with non-empty lines.