# Crowns of Iron — Milestones 13.22–13.24

Target: current browser-local single-player RTS on GitHub Pages.

## 13.22 — Defenders stop pursuing irrelevant targets
- Correct the AI attack-order fallback: an existing *offensive* command can be retained when a new target is unreachable, but a defensive command against an enemy outside the defended region must be discarded if no valid replacement is available.
- Defensive target retention requires an armed non-worker opponent, a legal unit attack domain, and proximity to a protected worker/building location (or original base as fallback).
- Valid in-zone attacks remain stable to avoid retarget thrashing. All issued new orders continue to use existing path validation. Player-issued orders are not overridden.

## 13.23 — First observed Age II progression
- Improve 120-second checkpoint analytics with the number of faction fixtures observed, number with an Age II-or-higher observation and mean first observed Age II checkpoint second.
- These are **sample checkpoint observations**, not exact age completion timestamps, and do not compare directly to target age-up times. If no game reaches Age II, report `null` rather than inventing a timing.
- Preserves the six-faction mirrored schedule, actual combat simulation, win/side data and existing statistics. No changes to damage or costs.

## 13.24 — Regression validation
- Add tests for target retention/release, protected-site distances, domain legality, observed age timing and absent Age II samples.
- Bump version to 13.24.0. Existing `npm test`, headless complete-match, mirrored balance, playtest packaging and Chromium Pages smoke remain release gates.

Automated tests are not proof of balance, mobile hardware performance or online PvP readiness.
