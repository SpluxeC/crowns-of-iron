# Crowns of Iron — Development Milestones 5.9–6.2

**Scope:** extend the existing authoritative local-playtest prototype, without claiming production multiplayer, final 3D models, animation, matchmaking, or balance validation.

## 5.9 — Authenticated server-side game options

`src/commandCatalog.js` builds a *player-scoped* list of all construction options, all trainable roles at existing facilities, and all research nodes from the host's active simulation catalog. It includes current-age availability, resource affordability, unit uniqueness, research prerequisites, queue status, training facilities, costs and durations. The server still validates every command; options are display hints, not a security boundary.

`GET /catalog` requires the same `X-Session-Token` as `GET /state`, and exposes no other player's economy or server credentials. The local multiplayer server now automatically loads the checked-in reconciled v0.2 JSON for fresh matches, making its six-faction 216-unit / 540-research definition available. Set `FULL_CATALOG=0` for the older shared archetype mode. Restore uses the versioned stored catalog and does not re-install it.

## 6.0 — Broader RTS player controls

The browser's unit, building, and technology dropdowns are populated dynamically from `GET /catalog`, not from hard-coded early-game choices. Research filters show available, current-age unlocked, queued, completed or all technologies, with cost and eligibility. Recruitment options include unit archetypes at each activated facility; unavailable or unaffordable options remain labeled but cannot be sent through the control. Friendly production and research queues expose cancel actions, with refunds governed by existing server simulation rules.

This is a functional list-based prototype, not full graphical technology-tree navigation, hotkeys, build-ghost validation, advanced hero interactions, all ability UIs, or production-quality localization.

## 6.1 — Shared passability preprocessing for group pathfinding

Group formation orders still perform bounded, deterministic breadth-first searches and minimum-route-cost assignment for up to 24 units, but now compile each distinct archetype's terrain traversability and stationary occupancy index **once per group**. Repeated BFS queries share that index instead of calling terrain rules on each cell in every search. Diagnostic instrumentation records index builds, indexed tile checks and route expansions. Movement and collision behavior remain governed by the existing authoritative tick.

This optimization is algorithmic and checked in deterministic tests; it is **not** a measured guarantee for 2,400 actively pathfinding units, a hierarchical navmesh, coordinated multi-unit flow fields, or production-scale CPU optimization.

## 6.2 — Reproducible multi-faction army rehearsal

`src/armyRehearsal.js` constructs an eight-player deterministic server fixture, with collision-enabled starts, 24 individually placed swordsmen per player, and 192 total formation orders. It advances simulation ticks, verifies no overlapping units and validates fog-filtered player snapshots and private-resource isolation. The match contains 224 live units (the 192 soldiers plus 32 starting units). The reproducible checksum is compared across identical runs. This is an **in-process local test**, not an eight-person Internet session, graphical benchmark, production latency or real human playtest.

### Verification

```sh
npm test
npm run validate
npm run syntax-check
npm run batch-5.9-demo
npm run protocol-server
```

Manual walkthrough: open `http://127.0.0.1:5190/client`, use a distinct dev token per local browser tab, choose any available building or facility-based unit from the server-derived catalog, inspect available/queued research, cancel a queued job, and cycle the WebGL view. Browser interaction and visual correctness are **not** proven by Node CI.

Checkpoints still require explicit `RESTORE_CHECKPOINT=1` or `RESET_CHECKPOINT=1` if the default local checkpoint file already exists; restoration rotates credentials.

## Next phase candidates

Production GPU art/asset pipeline, better selection and command UX, game-mode objectives shown on battlefield, real hardware frame-time profiling, hierarchical squad navigation, dedicated Internet server architecture with secure account identities and matchmaking. No public multiplayer exposure until a security and fault-testing plan is implemented.
