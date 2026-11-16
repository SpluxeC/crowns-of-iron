# Crowns of Iron — Milestones 13.1–13.3: AI Skirmish Reliability

Primary public target remains the single-player, **3D-only**, landscape-capable GitHub Pages game. Multiplayer development tooling is preserved.

## 13.1 — AI construction and recruitment
- For **full-catalog browser skirmishes**, each computer player plans housing when its population cap is tight, a Training Camp in the first age, Barracks/Archery Range/Forge in later ages, and a Resource Depot when eligible.
- Building placement is deterministic, based on available land and the assigned builder's reachability. Orders use the real construction engine and spend actual resources; they never grant resources.
- A builder can be taken off an existing spatial harvest job once an authoritative construction placement succeeds, rather than requiring idle workers indefinitely.
- AI military recruitment now considers each faction's age-specific units, completed production facilities, affordability, queue limits, and available population. Easy/Normal/Hard target progressively larger armies.
- The legacy non-full-catalog headless AI paths remain unchanged to avoid modifying existing economy benchmark assumptions. Tactical target selection still uses the existing deterministic `planArmyOrders`.

## 13.2 — Match-end feedback
- The browser simulation provides a result report **only after the match has ended**, keeping hidden enemy statistics off the active gameplay HUD.
- The 3D game presents a victory/defeat/draw overlay with elapsed game time, elimination versus time-limit result, and per-faction final score, surviving units, buildings and researched technologies.
- Players can close the report and inspect the battlefield or immediately start a new skirmish. Local single-player saves remain on-device.
- Score reports sort **copies** of per-player summaries; the actual simulation player array, which maps ownership and starting positions, is never reordered by scoreboard rendering.

## 13.3 — Repeatable simulation reliability
- New tests exercise all six factions' early spatial-economy play, deterministic 180-second AI simulations, and finite 30-minute score-based victory reports.
- AI construction tests cover budget spending, age restrictions, first military structure placement, housing shortages and repeatable state.
- Existing art, protocol/server, 3D renderer, mobile orientation, command and save/load test suites remain in CI.
- AI quality and balance are **not** certified by these scripted checks: complete matches across all matchups and physical-device usability still need human playtests.

## Validation

```sh
npm test
npm run build-pages
npm run pages-smoke
```

A successful GitHub Pages CI deployment from main publishes this batch to `https://spluxec.github.io/crowns-of-iron/`.
