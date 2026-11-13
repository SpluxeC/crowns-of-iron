# Milestones 1.5–1.8 — Full Data & Simulation Hardening

These milestones improve the already-running headless prototype. They do **not** mean the game is finished.

## 1.5 — Full reconciled catalog in runtime

The *actual* `data/balance-v0.2.json` is now committed. This contains:

- 132 land, 48 naval and 36 air unit rows, or 216 unique faction entries.
- 540 research nodes (90 per faction).
- 228 building stat rows (38 per faction).
- 126 local building-upgrade records (21 per faction).

`installFullCatalog(match, data)` validates and attaches all faction unit stats/prices, research age prerequisites, compatible research locations and exclusive branch locks. This is server-owned data; network clients cannot submit arbitrary replacement definitions.

`npm run full-data-demo` verifies the real imported values. The browser inspector also loads this file asynchronously.

**Important:** The catalog includes *data definitions*, not the executable behavior for every research effect or every faction-specific ability. The existing local construction catalog is still the implemented subset, and not all 228 building entries can be built yet.

## 1.6 — Finite resource harvesting

`harvest` is a validated, explicit Worker order: owned Worker, adjacent finite deposit, resource-age eligibility, capped 10-unit yield and two-second per-worker cooldown. It cannot extract more than remains in that tile.

This coexists with the earlier *abstract automatic worker income* model. A complete spatial economy should ultimately replace the abstract model and implement physical hauling, pathing, gathering animations and depot drop-offs; this milestone does not claim those.

## 1.7 — Ruins, salvage, reconstruction

`destroyToRuin`, `salvage`, and `rebuild` support one-time resolution of completed construction sites. Ruins expire after 300 simulated seconds. Eligible structures yield a bounded material salvage refund or can be reconstructed at 75% resource cost and 70% build duration.

Construction workers cannot be simultaneously committed to two unfinished jobs. Destroying active structures respects the existing production/research queue refund rules and uses non-reused building-channel IDs.

The tactical engine still lacks complete building HP damage and normal demolition-to-ruin combat events, and the ruination system covers the structures already in the construction catalog—not every building.

## 1.8 — Simulation integrity and local multiplayer view

The 1–60 second public `step` operation executes bounded 1-second substeps. The same sequence of commands now produces equal states whether time is advanced in one 30-second call or thirty 1-second calls.

The local network host now hides enemy stockpiles, queues, invisible units, unseen tiles and private orders. It rejects attacks on guessed units that are not currently visible, and denies remote direct heals/repairs until those can enforce range and cooldowns.

This is **a preliminary fog-of-war read model**, not public multiplayer security. The local-only HTTP development server still has development-only token handling, no public identity provider, no transport encryption, no rate limits, no replayable authoritative host event log, and no real network reconnection.

## Verification

```bash
npm test
npm run validate
npm run demo
npm run ai-demo
npm run full-data-demo
npm run syntax-check
npm run inspect
```

The final command is a manual browser check; the others run without graphical user interaction.

## Subsequent milestones

- Convert the 540 technology descriptions into typed executable effects with full stacking/cap rules.
- Complete the remaining faction active/passive kits, hero/spell targeting and anti-air counter types.
- Implement every structure and local building upgrade, plus battlefield structure damage.
- Replace automatic resource generation with a real spatial economy.
- Implement real formation/pathfinding/obstacles/line of sight.
- Server reconciliation, authentication, information filtering and performance tests.
- 3D client, production graphics/audio, responsive desktop/mobile gameplay.
