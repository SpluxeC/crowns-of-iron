# Crowns of Iron — Milestones 13.16–13.18

## 13.16 — Defenders redirect to urgent threats
- Existing AI attack commands are normally retained to prevent target thrashing.
- During **defend** stance, a sufficiently closer/higher-priority squad objective now preempts an existing valid AI-issued attack order, so defenders can return to a current raid on their own workers and buildings.
- Existing pathfinding, unit-domain eligibility, maximum orders per AI tick, and manual-order protection are unchanged.
- Candidate sorting now breaks duplicate unit-ID ties with enemy player IDs first, ensuring a stable selection when several enemies share unit IDs.

## 13.17 — Reproducible match progression telemetry
- The full-catalog mirrored benchmark now records checkpoints at **120-second intervals** for every match while it is still running.
- Every snapshot includes faction age, active combat units, active workers, finished technology, and finished AI constructions for both factions.
- No fake time jumps and no fabricated victories. Unresolved 480-second games remain unresolved.
- The benchmark asserts snapshot cadence, two participant records, and nonnegative development counts; it retains win/side-bias diagnostics introduced in 13.14.
- These snapshots provide a tool for later AI tuning; they do not themselves establish competitive faction balance.

## 13.18 — Regression and release gate
- Adds unit tests for emergency defender retargeting, stable target selection, and order-independent mirrored match reports.
- Version bump to **13.18.0**, registers `src/armyAI.js` for syntax validation.
- Required validation: Node test suite, mirrored 30-fixture balance benchmark, full seven-match reliability check, package generation, and Chromium GitHub Pages smoke.
- Do not claim a public deployment until the pull request has merged and the main Pages workflow has succeeded.

## Limitations
This is the browser-local single-player RTS. These automated checks are not equivalent to mobile-device profiling or PvP network testing. No changes to faction stat balance or the offline multiplayer prototype.
