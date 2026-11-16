# Crowns of Iron — Milestones 13.25–13.27

## 13.25 — Bounded reachable-target expansion
- Improve AI combat orders by checking up to **16** deterministic prioritized targets rather than only the first 8.
- The former eight-target cap could prevent attacks when enemies in front were unreachable but another target behind them was reachable.
- Preserve existing domain legality, ranged/melee path validation, user-order protection and AI maxOrders.
- Path probes stay bounded (1–32 configurable in the pure helper, production default 16) to protect CPU performance. This is a tactical heuristic, not unrestricted global pathfinding.

## 13.26 — Age III progression observations
- The existing mirrored faction diagnostic now also reports fixture count reaching Age III and average first **observed** Age III checkpoint second per faction.
- Checkpoints sample every 120 simulated seconds. These values are not exact age advancement timestamps, and no observation is reported as null instead of a fabricated number.
- Existing Age II metrics, 30 mirrored fixture setup and genuine skirmish outcomes are unchanged. No faction damage/cost buffs or nerfs.

## 13.27 — Release QA
- Add three tests for target search beyond old cutoff, its hard budget, first observed Age III, missing samples, and deterministic match ordering.
- Set package version 13.27.0. Required before merging: automated Node tests, static syntax, full match matrix, faction matchup gate, packaging, and Chromium Pages smoke.

Limitations: this is browser-local RTS development, not physical mobile profiling or live multiplayer validation.
