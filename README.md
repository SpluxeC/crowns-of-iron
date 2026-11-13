# Crowns of Iron

A five-age fantasy RTS with Humans, Orcs, Dwarfs, Tree Elves, Corrupt Elves, and Ursa.

## Status
**Headless simulation plus interactive 2.5D browser prototype, milestones 0.1–4.6.** This is not a playable 3D game or tested network multiplayer. Work is isolated on a development branch for review.

## Requirements
Node.js 22+. No package installation or external runtime dependencies.

```bash
npm test
npm run demo
npm run validate
npm run inspect       # local 2D browser inspector (not the final game)
npm run map-demo
npm run protocol-server # local-only match API foundation
npm run ai-demo        # deterministic economy-AI benchmark
```

## What's included
- Deterministic tick-based simulation, seeded RNG, replayable commands and snapshots.
- Six-resource stockpiles, gathering, farms, foresters and limited late-game recovery.
- Population, recruitment, production queues, hero and legendary limits.
- Shared research locations, twelve mandatory discoveries, auto age-up, cancellation/refunds.
- Direct damage, type counters, active healing, mechanical repair, burning/corruption.
- Last Stand and Conquest elimination scaffolding.
- Economy-only AI with Easy/Normal/Hard pacing and automated early research.
- Objective-score cores for Great Monument, King of the Hill, and Timed Score.
- Versioned checksum-validated save/load and normal-command replay recording.
- Tactical tile movement, active construction, faction hero abilities, local match protocol and 2D movement/attack inspector.
- Starter unit catalogs and authoritative balance constants, with provenance notes.
- Node built-in unit/integration tests and GitHub Actions.

Review [the milestone plan](docs/MILESTONES.md), [new milestone boundaries](docs/NEXT_MILESTONES.md), and [current limitations](docs/KNOWN_LIMITATIONS.md) before merging. The full v0.2 roster and technology effects will be imported in a subsequent data-integration milestone; this prototype intentionally does not pretend to contain all 216 final unit definitions.

## License
No license has been granted yet; all rights reserved pending an explicit licensing decision.

## Current 1.0–1.4 feature batch
See [milestone verification and limitations](docs/MILESTONES_1_0_TO_1_4.md). The local developer protocol server is available via `npm run protocol-server` and listens on loopback only. This is not a publicly secure multiplayer game server.

The full reconciled v0.2 numeric data can be loaded from `data/balance-v0.2.json` if that generated file is present. The runtime continues to use shared unit templates unless the full data catalog is explicitly loaded. The canonical 216 unit names and faction modifiers are embedded in `src/factionRoster.js`.

## Milestones 1.5–1.8
The reconciled six-faction data is now committed in `data/balance-v0.2.json`; run `npm run full-data-demo` to exercise the installed research and unit definitions. See [full data limitations](docs/FULL_DATA_RUNTIME.md). Additional systems include finite deposit harvesting, ruin salvage and discounted reconstruction, and protocol safety improvements. These do not yet constitute a complete 3D multiplayer game.

## Milestones 1.9–2.2
Executable optional technologies (37 shared tech IDs), three supported building-upgrade types, building siege damage and material-funded worker repairs are now in the headless simulation. Detailed support boundaries are recorded in [Milestones 1.9–2.2](docs/MILESTONES_1_9_TO_2_2.md). Unsupported tech and upgrades are **not** represented as implemented.

## Milestones 2.3–2.6
All 38 canonical structure names per faction can be constructed with the expanded data-backed system (the original 14 prototype definitions still override overlapping workbook values for compatibility). The simulation supports 60/126 local upgrade records, an opt-in finite cargo-and-delivery economy, and obstacle-aware ranged firing positions with line-of-sight checks. Use `npm run spatial-demo` to verify cargo hauling. See [milestone details and limitations](docs/MILESTONES_2_3_TO_2_6.md). The default economy remains abstract until spatial AI/UX is implemented.

## Milestones 2.7–3.0
The executable optional technology handlers now cover 52/78 research IDs per faction. Explicit open/closed allied gates, distinct land/naval/air navigation and optional autonomous spatial harvesting bots are integrated. Run `npm run advanced-demo` for a repeatable fixture. See [Milestones 2.7–3.0](docs/MILESTONES_2_7_TO_3_0.md) for gameplay limitations and unfinished research/production networking.

## Milestones 3.1–3.4
The prototype now includes opt-in connected coastal maps, coast-only Docks/Shipyards, staffed defensive towers/garrisons, **60 of 78 executable optional technologies per civilization**, renewable Farm/Forester/Aether production in spatial economy mode and deterministic army AI stances. Run `npm run batch-3.1-demo` for a reproducible smoke test. See [Milestones 3.1–3.4](docs/MILESTONES_3_1_TO_3_4.md) for implementation scope and remaining limitations.

## Milestones 3.5–3.8
Opt-in connected island sea lanes, finite ship fishing and completed dock-to-dock trade, naval-vs-land/air attack eligibility, **70 of 78 executable optional technologies per faction**, group formation and siege orders, and local authoritative snapshot resynchronization with reconnect-token rotation. Run `npm run batch-3.5-demo` and review [Milestones 3.5–3.8](docs/MILESTONES_3_5_TO_3_8.md). Eight optional tech effects per faction and full transport boarding, real network multiplayer, unit collision and the complete 3D game are still unfinished.

## Milestones 3.9–4.2
Real population-counted transport boarding/unloading, Siege Tower passenger ramps and defensive garrison assaults, **78 of 78 executable optional research handlers per faction** (prototype interpretations), and atomic authenticated local command batches with enhanced state filtering. The full 3D game, production networking, real collision, faction-specialized upgrades and complete gameplay balance remain unfinished. Run `npm run batch-3.9-demo` and consult [Milestones 3.9–4.2](docs/MILESTONES_3_9_TO_4_2.md) for exact coverage.

## Milestones 4.3–4.6
All **126 local faction building-upgrade records** now have executable prototype effects. Opt-in collision separates ground/sea units and blocks destination stacking; eight-player/2,400-population in-process host stress and extra loopback reconnect/batch endpoints are included. The browser inspector now has a selectable isometric 2.5D view and group movement controls. Run `npm run batch-4.3-demo` and `npm run multiplayer-stress-demo`; use `npm run inspect` to try the UI. See [milestone details and limitations](docs/MILESTONES_4_3_TO_4_6.md). This is **not yet a full 3D or production multiplayer game**.

### Latest development batch (4.7–5.0)

See [milestones 4.7–5.0](docs/MILESTONES_4_7_TO_5_0.md). Collision-enabled movement detours around occupied cells, the browser cycles through top-down/isometric/WebGL 3D block geometry with an orbit/zoom camera, and the local host supports optional lobby readiness plus integrity-checked checkpoint restoration. Development prototypes only, not production multiplayer or finished 3D gameplay. Run `npm run batch-4.7-demo`, `npm test`, and `npm run inspect` (manual browser QA required).

### Milestones 5.1–5.4: live browser playtest

See [the 5.1–5.4 milestone notes](docs/MILESTONES_5_1_TO_5_4.md). A **local same-origin network-connected multiplayer browser client** now exists. Start the loopback test server with `npm run protocol-server`, open **http://127.0.0.1:5190/client**, and enter one developer session token printed in the terminal. Each browser/tab needs its own player token. The server drives simulation time, enables collision-aware unit spacing, validates commands, filters enemy visibility, and streams event notifications; browsers fetch authoritative snapshots.

For an opt-in ready/start lobby, run with `REQUIRE_READY=1` (PowerShell: `$env:REQUIRE_READY=1; npm run protocol-server`). The game view has a top-down fallback and a rudimentary WebGL 3D camera. This is **not** secure public multiplayer, production matchmaking, animated 3D gameplay, or a balanced release build.

### Phase 5.5–5.8 — Connected RTS economy, recovery, and stream resilience

See [the 5.5–5.8 milestone notes](docs/MILESTONES_5_5_TO_5_8.md). The local multiplayer browser now supports early building placement with a selected Worker, choosing recruitment facilities, mandatory Age I–IV discoveries, and readable queues. The development server writes a local checkpoint to `.local/crowns-host-checkpoint.json` approximately every 5 seconds and at normal SIGINT/SIGTERM shutdown.

**Existing saves are protected.** Restart with `RESTORE_CHECKPOINT=1` to explicitly resume, or `RESET_CHECKPOINT=1` to explicitly discard an old local checkpoint. On restoration all dev session tokens change; use the newly printed credentials in your browser tabs. Neither mode should be used against untrusted checkpoint files. Browser updates use authenticated SSE and a polling safety net. This remains a developer-only loopback prototype.

### Milestones 5.9–6.2 — Full faction option UI and army rehearsal

See [5.9–6.2 detailed notes](docs/MILESTONES_5_9_TO_6_2.md). The loopback multiplayer prototype now loads the checked-in, reconciled v0.2 six-faction catalog on fresh startup by default, exposes an authenticated **GET /catalog** containing only the requesting player's buildings, trainable roles and technologies, and uses that catalog to power the browser's option menus, research filters and cancelable queues. Set `FULL_CATALOG=0` for the original shared-archetype-only prototype.

Multi-unit formation path planning now shares passability preprocessing across same-role soldiers. A deterministic eight-player in-process rehearsal executes 192 formation orders across 224 living units (including starting workers/scouts) and validates collision and fog invariants. Run `npm run batch-5.9-demo` and `npm test` to verify. **Not** a final 3D experience, an actual multi-computer test or production Internet multiplayer.

### Milestones 6.3–6.6 — Army controls, WebGL correctness and active-movement test

See [the 6.3–6.6 milestone notes](docs/MILESTONES_6_3_TO_6_6.md). The connected **2D** client supports drag selection, Shift selection, Worker/Military shortcuts and temporary Ctrl+1–4 control groups. Multi-unit Move uses formation navigation. The 3D prototype now has corrected homogeneous perspective projection, player-relative unit colors and cached GPU terrain geometry. The deterministic simulation's collision tick uses incrementally maintained occupancy. A reproducible local eight-player rehearsal orders **384 soldiers** across 16 formations and verifies 416 total live units. Run `npm run batch-6.3-demo`. This is **not** a production-quality art or multi-computer networking release.

### Development Phase 6.7–7.0 — RTS silhouettes, combat groups and diagnostics

See [the milestone 6.7–7.0 guide](docs/MILESTONES_6_7_TO_7_0.md). Low-poly 3D role identities, building rooflines and five-pip unit health indicators improve battlefield readability. Selected combat units can focus-fire a visible enemy or stop current orders with **atomic server-authenticated batches of up to 16**. The local connected browser shows bounded timing percentiles for top-down Canvas CPU drawing, WebGL CPU submission and HTTP requests. Run `npm run local-http-benchmark` for actual (still **localhost-only**) authenticated HTTP response timing with eight sessions; `npm run batch-6.7-demo` adds integration assertions. This prototype has no professional 3D art, hardware GPU FPS certification, secure public multiplayer or matchmaking.

### Milestones 7.1–7.4 — Combat directives and measurable performance

See [7.1–7.4 milestone documentation](docs/MILESTONES_7_1_TO_7_4.md). New server-authoritative **Attack-move** and **Hold / Guard / Aggressive** stances improve combat orders and are controllable from the browser for groups of up to 16 units. A declarative 3D proxy asset manifest separates role/structure geometry identities from the WebGL renderer. A real loopback HTTP delivery smoke test verifies client modules, command controls, authenticated commands and privacy. A 128 × 128 headless eight-player benchmark creates **2,400 units, 64 with attack-move orders**, reports CPU tick times and checks collision. Run `npm run batch-7.1-demo` or individual `npm run browser-delivery-smoke` and `npm run large-army-profile`. These are still prototype-only checks, not professional graphics, real browser QA, 2,400 moving units or Internet-ready multiplayer.

### 3D OBJ models and interactive asset gallery — Milestones 7.5–7.8

Ten **original, editable Wavefront .obj 3D polygon meshes**, plus a common `.mtl` material palette, now live under [assets/models](assets/models). These cover seven unit roles (Worker, Infantry, Ranged, Hero, Siege, Ship and Aircraft) and three building families (Civilian, Defense and Tower). The real mesh data—not just texture illustrations or procedural cube placeholders—is loaded into the WebGL battlefield renderer using a strict local OBJ/MTL parser. Assets fall back gracefully to the prior proxy geometry if the browser cannot load them; detailed unit meshes are capped at 160 visible units per drawing pass for prototype performance. No custom image CDN or imported JavaScript dependencies.

Run `npm run protocol-server`, then open **[the local 3D model gallery](http://127.0.0.1:5190/model-gallery)** to choose and rotate individual models. The multiplayer development client at `http://127.0.0.1:5190/client` also loads the models when switching to 3D. Run `npm run model-assets-demo` to validate OBJ triangles, materials, paths and HTTP serving. See [full model editing and limitations guide](docs/MODEL_ASSETS_7_5_TO_7_8.md).

These are reusable first-pass class-family models. They **do not** yet constitute 216 unique faction-specific unit designs, authored animation rigs, textured PBR production art, or verified visual browser/GPU quality.

### Faction-specific 3D art — Milestones 7.9–8.2

**60 new original faction-specific Wavefront OBJ meshes** (six playable factions × seven unit families + three structure families) have been generated and integrated into the existing WebGL game. Each has real polygon additions, distinctive silhouette details, faction proportions and armor/skin/primary/trim materials. Six additional **32×32 RGB PPM surface patterns** are sampled onto those OBJ meshes' **vertex colors**, and six procedural seven-joint rig profiles animate idle/walk/attack vertex poses. The local 3D gallery at `http://127.0.0.1:5190/model-gallery` allows faction/model/clip selection.

All assets live in `assets/models/factions/`, `assets/textures/factions/` and `assets/rigs/`. Run `npm run faction-art-demo` to validate. The generator scripts `npm run generate-faction-art`, `npm run generate-faction-textures` and `npm run generate-faction-rigs` reproduce original art sources.

See [the art stage details](docs/FACTION_ART_7_9_TO_8_2.md) for Blender editing, local preview and limitations. These are stylized original first-pass **family** assets; they are not yet 216 unique catalog models, UV/PBR textures, a skinned skeleton/FBX pipeline, professional animations or real-hardware visual testing.
