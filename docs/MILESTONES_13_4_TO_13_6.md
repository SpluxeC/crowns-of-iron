# Crowns of Iron — Milestones 13.4–13.6

Primary playable release: 3D-only single-player skirmishes on GitHub Pages, with dormant multiplayer development code retained.

## 13.4 — Longer AI match rehearsals

The new `npm run solo-soak` runs real deterministic 48×48 RTS simulations using the reconciled six-faction catalog, spatial harvesting, unit collisions, structures, recruitment, combat, and AI at the normal one-second tick granularity:

- A **600-second (10-minute)** one-human/one-Hard-AI match at seed 713.
- A **420-second (7-minute)** one-human/three-Normal-AI match at seed 827.
- A repeated 600-second seed-713 run checks matching complete-state checksums and winner outcomes.
- During simulations, validates nonnegative resource inventories, legal population, positive HP for alive units, active AI decisions, and actual AI base construction. Reports real execution time and peak tick cost in the `SOLO_SOAK_RESULT` CI log.
- The terminal result presentation is exercised after the rehearsal. The full 30-minute end condition is score-checked, not claimed to have been dynamically simulated to completion for all matchups.

This is headless *gameplay logic*, not proof of 17 minutes of real-time visual gameplay or mobile GPU load.

## 13.5 — AI military strategy

`src/botStrategy.js` adds deterministic tactical stance selection for full-catalog skirmish AI:

- **Defend** when hostile armed units concentrate near the AI start or enemy units threaten its workers.
- **Assault** as the standard offensive behavior when local threats have subsided.
- **Raid** for Normal/Hard opponents when their available army is strong enough to pressure enemy economies.
- A minimum 15-second strategic-state interval reduces order thrashing and rapid oscillations. Existing `planArmyOrders` validates reachability and engages appropriate target domains.
- Existing non-full-catalog headless tests and the dormant multiplayer development path retain their original AI execution semantics.

The bot is improving incrementally; it is not a tournament-strength opponent and does not use machine learning.

## 13.6 — Mobile performance adaptation

The full-viewport 3D renderer now uses `web/mobilePerformance.js`:

- Automatically sets a cap of **30 rendered camera frames/second** on touch/small-screen devices and 45 on desktop; camera input and simulation timing remain independent.
- Mobile resolution starts at a bounded device pixel ratio, decreasing in steps after sustained slow CPU draw calls and increasing cautiously when sustained rendering becomes inexpensive.
- Exposes **Auto**, **Performance**, and **Quality** controls through the empire drawer, with average CPU render time, DPR and target frame rate. Performance fixes resolution at a reduced scale; Quality uses the full capped scale.
- Never sends graphics-performance measurements to an external analytics service. No dedicated server required.
- The 2048-pixel canvas dimension cap remains in force. Frame sampling measures synchronous scene generation/submission CPU time and is **not** a GPU timer; actual frame rate can vary by device.

## Validation and limitations

- `tests/botStrategy.test.js` covers local threats, 15-second stance stability, raid triggers and difficulty limits.
- `tests/mobilePerformance.test.js` covers resolution bounds, sustained slow/fast frames, manual profiles and invalid timings.
- `scripts/pages_smoke.js` verifies mobile graphics presets by checking actual canvas buffer scaling in real headless Chromium.
- `.github/workflows/pages.yml` runs the longer AI soak before static asset build, browser smoke and public deployment.
- Simulations are deterministic tests, not live sessions; test phone/tablet performance and controls on physical devices before declaring hardware readiness.

**Preserved:** six factions, AI skirmish options, fullscreen landscape UI, save/load, tactical controls, WebGL model gallery, and older multiplayer source.
