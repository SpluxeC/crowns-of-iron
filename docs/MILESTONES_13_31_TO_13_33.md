# Crowns of Iron — Milestones 13.31–13.33

## 13.31 — Mixed-domain military objective scoring
- Squad target ranking now considers how many units in the selected army can legally attack an enemy under the existing `canEngage` rules.
- A high-priority aircraft target should not pull the entire land force away from a similarly situated land threat it can actually fight.
- Introduces an engagement coverage penalty without modifying damage, costs, or the deterministic owner/unit tie break. The order planner still verifies reachable routes and issues only valid orders.

## 13.32 — Multiple mandatory research resource deficits
- When all spatial workers are busy, the AI now considers **every** shortage for the next mandatory age technology in priority order, skipping resources already covered by another worker.
- Only empty-handed harvesters that have held their assignment at least 20 seconds and are not gathering another deficient resource are candidates for reassignment.
- Deposits must remain accessible and the harvest validator must accept the change; resources are never added for free.
- This targets late-age research deadlocks caused by multiple shortages, not a broad AI economy redesign.

## 13.33 — Resuming mobile browser sessions
- Adaptive graphics controller discards duplicate frame timestamps.
- An observation after more than 10 seconds without frames clears stale rolling averages and slow/fast streaks. This prevents performance before a pause from immediately adjusting a newly resumed rendering session.
- Resuming the app does not change game simulation time or multiplayer state; only the WebGL quality sampling policy changes.
- Adds tests for engagement coverage, multiresource deficits, and pause/resume sampling.

## Release verification
Version **13.33.0**. Expected CI: complete Node regression suite, faction benchmark, complete headless match matrix, browser art tests, static Pages build and Chromium smoke, plus local playtest packaging. GitHub Pages deployment is only confirmed after main-branch deploy succeeds.

Limitations: headless/browser automation is not a physical-phone or live PvP test.
