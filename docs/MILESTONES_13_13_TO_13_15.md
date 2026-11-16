# Crowns of Iron — Milestones 13.13–13.15

These changes build on merged 13.12.0, without changing faction stats, age research costs, 3D camera, touch controls, or multiplayer development code.

## 13.13 — Immediate military threat response
- AI workers and bases now respond to genuine **armed** threats; enemy workers are not counted as nearby military attackers.
- A new armed threat interrupts an active 15-second **assault/raid** cooldown and switches the bot to defense immediately at its next AI decision.
- Exiting defense and switching back to aggressive tactics still respects the 15-second hysteresis. Bot decision cadence (Easy/Normal/Hard) remains unchanged.

## 13.14 — Mirrored matchup diagnostics
- Adds a pure deterministic matchup analyzer for same-seed, reverse-side faction pairs.
- Separately reports left-side victories, right-side victories, resolved wins, unresolved games, split-pair results, and interim score leads.
- Invalid winners, missing reverse fixtures or unequal mirror seeds fail the benchmark instead of silently misleading the balance report.
- The existing 30 full-catalog headless mirrored fixtures continue to produce actual combat results; no speculative unit-stat rebalance is applied.

## 13.15 — Automated regression suite
- Adds emergency-defense, passive-worker threat, cooldown, unresolved-outcome, and mirror-integrity tests.
- Registers the mirrored analyzer in the package syntax-check gate and bumps to v13.15.0.
- `npm test`, `npm run faction-matchups`, `npm run full-match-matrix`, and the Pages Chromium smoke are expected validation gates. CI success should be checked in GitHub Actions before merging.

## Remaining limitations
This is automated headless logic and scripted browser QA, **not** physical device profiling or live competitive balance evidence. Multiplayer remains development-only.
