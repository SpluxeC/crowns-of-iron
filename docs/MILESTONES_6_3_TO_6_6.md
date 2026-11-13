# Crowns of Iron — Milestones 6.3–6.6

**Scope:** playable local RTS prototype improvements and reproducible headless stress tests. Not a production-grade game, polished art, browser hardware QA, public multiplayer, or a guaranteed 2,400-unit pathfinding result.

## 6.3 — Army selection and commands

The connected 2D browser now supports click selection, click empty terrain to clear, drag a rectangular marquee over up to 24 owned live positioned units, Shift+drag additive selection and Shift+click toggling. W selects up to 24 workers, A selects up to 24 military units, Ctrl+1 through Ctrl+4 saves temporary control groups, 1–4 recalls surviving members and Escape clears selection. Multi-unit Move automatically issues a 24-unit formation command; single unit Move remains individual. Controls are intentionally scoped to the current browser tab, are not persisted, and work in 2D (3D retains click-to-select and orbiting). The server always validates ownership and the resulting move.

The selection functions in `web/unitSelection.js` have pure deterministic Node tests; HTML pointer interactions still require manual browser testing.

## 6.4 — Correct perspective and cached terrain WebGL rendering

The previous WebGL vertex shader used a normalized-depth position with `w=1` while also dividing x/y by view depth, causing incorrect perspective scaling. The revised homogeneous clip coordinates now use `w=depth`, matching CPU projection and terrain ray-picking. Static terrain GPU geometry is generated only when the fogged world's terrain/resource/structure signature changes; dynamic units are uploaded separately each frame. Camera orbit and troop movement no longer rebuild static terrain buffers. Selection, player-based colors and existing fog visibility are preserved.

This remains low-poly proxy geometry, not textured models, animation, shadows, a glTF pipeline, hardware FPS certification, occlusion culling or advanced rendering. A fake WebGL implementation tests buffer reuse, uniforms and shader expressions but cannot replace real GPU visual QA. Terrain change checks still scan tile metadata each rendered frame.

## 6.5 — Incremental collision occupancy

The movement tick previously recomputed full-match unit occupancy on every attempted step. `src/battlefield.js` now constructs the collision occupancy index once per tick and transfers indexed entries after every successful move. Bounded rerouting uses the same live index so later units see earlier moves. The opt-out legacy collision mode remains unchanged.

This improves asymptotic collision lookup and has no guarantee of optimal movement, deadlock avoidance, true simultaneous movement or full match-scale CPU budgets. Server combat target lookup and other subsystems still have separate performance considerations.

## 6.6 — Larger actively moving army rehearsal

`runArmyRehearsal({squads:2,ticks:4,seed:260})` uses eight player authorities, two 24-unit formations per player, **384 formation-controlled soldiers**, plus 32 original starting units for **416 living units** total. Squads spawn in distinct radial and tangential staging areas and choose a valid destination deterministically from four bounded candidates. The host processes 16 authoritative formation commands and advances four one-second collision-enabled ticks. Tests assert repeatability, no overlapping cells, and player fog/privacy. The demo reports wall time as observational data only: machine timings will vary.

This is an **in-process Node simulation**, not 416 independently network-connected clients, a real-browser graphics benchmark, real-world match balance data or a sustained 2,400-unit fighting test.

## Run the checks

```sh
npm test
npm run validate
npm run syntax-check
npm run batch-6.3-demo
npm run protocol-server
```

Open `http://127.0.0.1:5190/client` using each player's current development session token to interact with the loopback-only test server. Existing checkpoint files still require explicit `RESTORE_CHECKPOINT=1` or `RESET_CHECKPOINT=1` flags. Token rotation and checkpoint rules from phase 5.7 remain.

## Remaining gaps

Manual real-browser 2D/3D pointer, keyboard and mobile input QA; realistic GPU load/visual QA; a real glTF/art content pipeline; broad combat controls/attack-move; hierarchical pathfinding; scalable visibility queries and combat target indexes; remote secure account-based multiplayer, matchmaking and NAT considerations. Draft PRs remain stacked; merge in order.
