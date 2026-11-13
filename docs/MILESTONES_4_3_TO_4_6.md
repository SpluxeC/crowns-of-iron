# Crowns of Iron — Milestones 4.3–4.6

**Status:** deterministic headless game prototype, local loopback protocol, and interactive browser inspector/2.5D isometric preview. These are development slices rather than a complete 3D, cross-platform, production multiplayer RTS.

## 4.3 — All 126 local upgrade records supported by executable effects

All 21 shared local upgrade names × six civilizations are now recognized and purchasable when their building, age, resources, and per-site queue conditions permit. The original ten local effect kinds remain, plus:
- Field Hospital Medical Tools: +10% staffed healing; Patient Ward: +4 patient population capacity.
- Resource Depot Sorting Sheds: +5% local drop-off handling; Farm Improved Irrigation: +10% output.
- Forester Fast Saplings: +12.5% local Wood output as an 80-second rather than 90-second cycle approximation.
- Market Trade Counters: +5% Gold on qualifying nearby allied dock trade routes.
- Dock Repair Yard: +10% nearby staffed ship repair throughput; Airship Hangar Maintenance Bay: +15% nearby staffed aircraft repair.
- Watchtower Archery Emplacements: +1 staffed firing slot; Stone Gatehouse Powered Winch: 20% shorter optional timed gate opening (2.5 seconds reduced to two). Instant legacy gate commands remain available.
- Aether Condenser Stable Core: +10% local condenser Aether output.

Local effects attach to **specific sites**, are lost when their structure is destroyed, and have explicit staffed actions where relevant. The original shared research effects and abstract income benchmarks remain separate.

Note: a completed upgrade's numerical effect is wired into prototype runtime systems, but the intended 3D animations, true Forester tree-growth scheduling, full Market trading UI, actual ward patient assignment, dock machinery and final balance tests remain pending. The starting Town Center still lacks a physically placed initial site.

## 4.4 — Opt-in terrain-domain unit collision and basic formation reservation

`enableUnitCollision(match)` must be called before game simulation starts. It deterministically separates initially stacked land/naval units and rejects a movement step into a cell occupied by a live unit in the same domain. Aircraft still share air cells; group formation orders avoid assigning occupied target destinations outside the selected group.

Legacy headless simulations leave collision **disabled by default** for existing reproducibility and economic-combat comparison. Collision-aware group formations are still grid-based and do not preserve spacing during movement. Waiting units can deadlock in narrow chokepoints; dynamic congestion-aware replanning, large-unit footprints, cavalry/ship turning radii, animation and terrain physics are unfinished.

## 4.5 — Local multiplayer host stress and loopback API improvements

Added `runLocalHostStress`, a deterministic fixture with eight factions and up to **300 population per faction (2,400 combined)**. It advances the host, checks its authoritative checksums and versioned, fog-filtered player views, and exposes a repeatable console demo. It is a functional in-process load probe, **not** a network throughput, player-latency, bandwidth, hostile-client or production performance qualification.

The loopback-only HTTP development server now supports `GET /resync?afterVersion=...`, `POST /command-batch`, and `POST /session/rotate` alongside the previous development state and command endpoints. All use the server-authenticated session token header and existing size/sequence protections.

Missing production architecture: TLS termination, real user identity/authentication, matchmaking, secure session distribution, server persistence, WebSockets/real-time streaming, reliable reconnect after host crash, robust network transport, hosting and anti-cheat. Do not expose this development server to the public Internet.

## 4.6 — Selectable interactive isometric browser preview

The existing browser inspector can now switch between top-down and isometric 2.5D tile representations. Both views share the same match state and unit positions. The isometric preview renders terrain, elevated hills, structure blocks, allied/enemy unit markers, selection highlights and clicked tile inspection. Users can Shift+click allied units for a selection group and issue grouped movement orders from the browser interface.

The projection is intentionally a **2.5D Canvas preview**, *not* a true 3D game or WebGL engine. Missing: a freely orbiting RTS camera, meshes/animated units, lighting, textures, full production HUD, selection boxes, fog-of-war render polish, audio, mobile gesture controls and actual network-connected gameplay.

## Verification

```bash
npm test
npm run validate
npm run syntax-check
npm run demo
npm run ai-demo
npm run full-data-demo
npm run spatial-demo
npm run advanced-demo
npm run batch-3.1-demo
npm run batch-3.5-demo
npm run batch-3.9-demo
npm run batch-4.3-demo
npm run multiplayer-stress-demo
npm run inspect
```

The final browser inspector check must still be done interactively by a human; the other commands are automated. All tests are prototype-level and do not substitute for full multiplayer gameplay tests.

## Recommended next batch

Prioritize actual 3D WebGL rendering and camera, intelligent multi-unit congestion/pathfinding, public-service networking architecture, player lobby and persistence, and faction-specific hero abilities/economic balance validation.
