# Crowns of Iron — Milestones 13.34–13.36

## 13.34 — Defensive worker protection
- The coordinated AI squad objective now scores nearby threatened **living allied workers**, distinguishing a raider actively menacing harvesters from a similarly distant attacker near a quiet base.
- Only armed, engageable enemies near protected assets qualify in the defend stance. Worker protection is capped at three workers per objective to avoid unbounded stacking.
- Existing deterministic target tie-breaks, threat preemption, reachability, human orders and faction damage are preserved.

## 13.35 — Mandatory resource logistics
- Fix a genuine research-priority bug: the prior code found an uncovered mandatory resource deficit and selected a reassignment worker, but still iterated every generic resource in priority order. It could send the worker back to its old optional harvest job.
- Rebalanced workers now consider **only** the selected uncovered mandatory input. If no reachable viable deposit exists, the old job is not overwritten.
- Idle workers keep the broader weighted priorities. A reassigned worker must still be empty-handed, harvesting an optional resource for 20 seconds, not building, and pass the authoritative harvesting path and age checks.
- No resources are credited or age technologies completed artificially.

## 13.36 — Large-frame/resume rendering resilience
- On return after a greater than ten-second rendering gap, the adaptive mobile render policy resets stale frame samples **and restores its nominal 30 FPS cap** (45 on desktop) while retaining the lower resolution until stable frames justify an increase.
- Extremely large measured frame durations (e.g. from browser suspension) count as a bounded 250ms sample, preventing an unrepresentative outlier from dominating the rolling average.
- Adds regression tests for worker hazard scoring, correct target choice, mandatory-deficit-only rebalancing, and graphics recovery. This is web rendering behavior, not proof of performance on physical devices.

## Validation gates
Version 13.36.0: Node tests, headless simulation, mirrored faction benchmark, full 30-minute-capped match matrix, browser art smoke, Pages build and Chromium smoke, local package checks. Do not merge/deploy without a successful latest-head CI run.
