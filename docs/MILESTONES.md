# Crowns of Iron — Prototype Milestones

- **0.1 Foundation:** ESM modules, schemas, deterministic seeded random, serialization; included.
- **0.2 Economy and research:** six resources, worker output, farm/forester/recovery, 12 mandatory discoveries, research queues; included as first-pass rules.
- **0.3 Production and combat:** cost reservation, population, hero/legendary uniqueness, damage counters, healer and repair rules; included as first-pass rules.
- **0.4 Match execution:** deterministic commands and ticks, Last Stand, Conquest scaffolding, tests, demo, CI; included as first-pass rules.
- **0.5 Data pipeline:** standard-library XLSX importer and six-tab validation into JSON; code included. Generated data file must be imported from the provided workbook before runtime integration; ability kits not included.
- **0.6 Map + inspection preview:** deterministic tile map, nearby-resource parity, grid placement and 2D browser inspector included; full 3D camera/renderer and actual unit path movement not included.
- **0.7 Economy AI:** deterministic difficulty profiles, worker allocation, Age II progression, basic production priorities; **economy AI included**, tactical military AI not included.
- **0.8 Objective scoring:** Monument hold, contested Hill capture time, Timed Score and existing Conquest; **scoring cores included**, physical world objective integration pending.
- **0.9 Save/replay:** versioned JSON snapshot checksum and deterministic normal-command event recording; **prototype included**, network-grade security and bot/mode configuration replay pending.
- **1.0+ Multiplayer and game client:** authoritative network transport, 3D renderer, tactical AI, full faction abilities, real map objectives, mobile controls and production balancing; **not included**.

The code uses simplified shared archetype data to exercise gameplay rules. Do not infer combat balance from this prototype without positional combat, faction powers, and representative populations.

- **1.0 Tactical movement:** tile movement orders, Manhattan-distance target acquisition, bounded combat steps, and basic bot tactical target selection. Full collision/navmesh tactics pending.
- **1.1 Construction:** worker-driven construction with placement checks, resource costs, age locks, progress, site cancellation and production-facility activation. Repair/reconstruction and large structures pending.
- **1.2 Faction abilities:** six named hero actives and passive identities, cooldowns and finite buff/status effects. Detailed per-faction roster mechanics pending.
- **1.3 Multiplayer protocol:** authenticated in-memory command sessions, monotonically increasing sequence numbers, local HTTP development server. Production networking, fog-of-war and matchmaking pending.
- **1.4 Browser inspector:** 2D unit display, move/attack orders, worker construction and a basic enemy bot. Still not 3D or shipped mobile gameplay.

- **1.9 Research effects:** 37 typed optional research effect IDs out of 78 optional per faction; 12 mandatory age-progress nodes already operational. Remaining 41 optional effects per faction not yet implemented.
- **2.0 Local building upgrades:** 126 data rows loaded; three local upgrade types have purchase/queue/execution handlers (18 faction-specific rows), remainder deliberately unavailable.
- **2.1 Structure combat:** actual completed building HP takes attack damage with counters; destruction creates rebuildable or salvageable ruins.
- **2.2 Repair/cooldowns:** staffed material-based building repairs; healer and mechanical repair cooldowns and network authorization tests.

- **2.3 Full building identity catalog:** 38 structures × six factions are enabled; 14 older prototype structures keep their existing baseline stats for compatibility. Specialized interactions remain incomplete.
- **2.4 Local building upgrades:** 60/126 records have executable training speed, HP or housing logic; 66 upgrades remain descriptive only.
- **2.5 Spatial economy:** optional finite Worker harvesting, cargo capacity, walking and depot delivery, without passive income duplication. Default remains abstract economy.
- **2.6 Combat navigation:** wall/hill line-of-sight blockers and reachable ranged firing positions; projectile arcs and unit collision remain pending.

- **2.7 Research effect expansion:** 52/78 optional effects per civilization executable; 26 still pending per civilization. Structures receive additive HP modifiers without regeneration.
- **2.8 Gates and walls:** explicit owner-only open/close gate commands, allied land passage and blocking walls; advanced siege interactions remain pending.
- **2.9 Domain navigation:** separate terrain eligibility for land/sea/air and water-only naval spawns; water-map generation, docking and altitude remain pending.
- **3.0 AI spatial harvesting:** opt-in spatial economy bots find finite deposits and haul to delivery; strategic AI/build orders and spatial multiplayer incomplete.

- **3.1 Coastal generator:** explicit connected naval perimeter, deterministic shore pads and validated Dock/Shipyard adjacency; normal generator unchanged.
- **3.2 Fortifications:** infantry garrisons for five structure types, owner-only orders, timed defensive fire, destruction evacuation and firing-slot technology.
- **3.3 Executable tech:** now 60 of 78 optional effects per civilization; Farm, Forester and Aether condenser spatial renewables plus Corruption mitigation.
- **3.4 Army AI:** server-side assault/defend/raid/hold stances, threat priority and reachable tactical targeting.

- **3.5 Island and naval logistics:** opt-in connected island basin, legal naval combat categories, finite fishing and actual route-completion ship trade.
- **3.6 Research effect expansion:** 70 of 78 optional tech handlers per faction; eight effect types remain descriptive. Transport capacity attributes and trade/scouting specializations included.
- **3.7 Military formations and siege:** atomic multi-unit move assignment and reachable siege approach/attack orders; collision-aware formation retention remains pending.
- **3.8 Multiplayer resynchronization prototype:** monotonic host versions, fog-filtered resync snapshots and credential rotation; full Internet networking and secure sessions pending.

- **3.9 Transport passengers:** owned units can board/unload Ship/Air Transports and Siege Towers, reserve population, and suffer casualty outcomes on carrier destruction; collision-accurate transport remains pending.
- **4.0 Research effect completion:** 78/78 optional technology IDs have executable shared prototype handlers across all six civilizations, including XP, defensive unlocks, conversion, Aether, and siege disruption; effect balance/UX incomplete.
- **4.1 Siege Tower ramp:** five-second deployment, abstract battlement garrison assaults and tower collapse passenger evacuation; no pathable wall-top geometry.
- **4.2 Local network hardening:** atomic authenticated command batches, per-tick command budget, restricted client checksums and fogged enemy-unit metadata; public multiplayer architecture remains pending.

- **4.3 Complete local upgrade handler coverage:** 21 upgrades per faction, 126 executable records; staffed hospital/vehicle support, local renewable and trade modifiers, defensive slots and timed gate mechanisms.
- **4.4 Unit collision prototype:** opt-in deterministic placement and grid occupancy-blocking with formation destination reservations; congestion/pathing still limited.
- **4.5 Host reliability probes:** loopback resync, atomic command-batch and token-rotation endpoints; in-process 8-player/2,400-population stress fixture, not real network load.
- **4.6 Browser interactions:** switchable top-down/isometric 2.5D preview and Shift+click group movement; true GPU 3D client still to build.

- **4.7 Congestion detours:** deterministic, bounded occupancy-aware movement replanning in opt-in collision mode; no physics footprint or sophisticated chokepoint control.
- **4.8 WebGL 3D terrain preview:** orbit/zoom camera and GPU block geometry for terrain, elevation, sites and units; no final art, animation or physically accurate picking.
- **4.9 Pre-match readiness:** opt-in authenticated local lobby, all-ready check and host-only launch before commands/advancement.
- **5.0 Host checkpoints:** checked match, sequence/version and readiness restoration with newly generated session tokens; not secure signed saves or persistent hosted service.

- **5.1 Route-cost formations:** deterministic shortest-path routing and minimum-cost slot assignment for groups up to 24, avoiding fixed non-group unit blockers when collision enabled, with atomic order assignment. Intra-group motion still requires improvements for chokepoints.
- **5.2 More informative WebGL geometry:** direct camera-to-terrain ray picking (including hills), forest shapes and role-distinct worker/hero/naval/aircraft proxy proportions. Not final meshes, lighting or animation.
- **5.3 Live loopback server transport:** header-authenticated same-origin Server-Sent Events **version-only** stream plus server-owned HTTP commands/state, capacity limits and static game client. No public network deployment or WebSockets.
- **5.4 Network gameplay browser:** private token connect, ready/start lobby, fog-filtered authoritative snapshots, 2D/WebGL camera and selection, move/group/attack/train commands and SSE reconnect. Local prototype only, no independent local simulation.

- **5.5 Local multiplayer construction UI:** selected Worker placement and early building costs/age choices in connected browser; server still owns and validates placement and spending.
- **5.6 Research and production inspector:** mandatory discovery selection with dependency/queue checks, active facility recruitment and friendly research/production queues; not a full technology tree or polished shop UI.
- **5.7 Disk-backed local host recovery:** atomic same-directory restricted-file snapshots, five-second periodic write and shutdown save, explicit restore/reset guard, newly issued session tokens. Still not replicated, crash-proof hosted persistence.
- **5.8 Stream robustness:** bounded version-only SSE frame decoder, reconnect-state refresh and five-second polling fallback; still local HTTP, not secure public Internet matchmaking or transport.

- **5.9 Authenticated player options:** construction, full available training roles and technology selections derived from the actual server rules and the current player's faction; fresh local matches install reconciled v0.2 data by default.
- **6.0 Broader local RTS UI:** server-catalog-based building, unit and technology menus with availability/cost hints, age/queue research filters, and server-side queue cancellation and refunds. Not a complete RTS UX.
- **6.1 Shared terrain cache for formations:** one static passability index per unit archetype per formation instead of repeated per-unit map traversal checks; still bounded tile BFS rather than navmesh/pathfinding crowds.
- **6.2 Eight-player army rehearsal:** collision-enabled 192-unit formation orders and 224 living units across eight factions/player slots with deterministic host state and fog assertions; not real network load or GPU testing.

- **6.3 Army interaction:** drag and Shift-select up to 24 owned live units, W/A unit selection, Ctrl+1–4 local control groups, group Move routes through formation orders. 2D marquee only.
- **6.4 WebGL rendering correctness and caching:** homogeneous perspective projection fix, static terrain GPU buffer reuse across moving-unit/camera frames, player-relative team coloring; still block models without real GPU visual QA.
- **6.5 Incremental collision occupancy:** build one per-tick occupancy index and update on movement instead of rescanning the entire army at each unit step. No full crowd deadlock solution.
- **6.6 Active army rehearsal:** eight players, 16 distinct squads and 384 formation-controlled soldiers (416 total live units), deterministic feasible destination search, collision and privacy assertions. Headless Node rehearsal only.

- **6.7 Readable procedural 3D:** visible building rooflines/defensive structures, low-poly workers, infantry, siege, naval and air silhouettes and damaged/selected unit HP pips. Still no authored character assets, animations or actual GPU hardware validation.
- **6.8 Atomic group combat controls:** browser target-focused up-to-16 combat batch, server-validated Stop orders and rollback tests for invalid ownership or visibility; not attack-move or auto-targeting.
- **6.9 Live browser performance telemetry:** bounded p50/p95 for CPU-render submission and authenticated HTTP round trips, no server upload, not GPU FPS.
- **7.0 Actual localhost HTTP benchmark:** up to eight authenticated simulated sessions, fog-filtered private-resource checks and response size/duration p50/p95. No WAN/TLS/remote client load.

- **7.1 Attack-move and combat stances:** server-validated attack-move that resumes destination routing after an enemy is defeated, Guard/Aggressive/Hold stances and 16-unit atomic browser batches. No full formation-level combat AI.
- **7.2 Declarative asset manifest:** seven versioned procedural unit silhouettes and three building proxy families, with geometry registry validation. Not an imported 3D asset pipeline.
- **7.3 Real HTTP browser-delivery smoke:** verify all client modules, visible controls, CSP, authenticated stance round-trip and opponent privacy. No actual browser event/visual automation.
- **7.4 2,400-unit local CPU profile:** eight players with 300 units each, 64 ordered moving units, collision validation and per-tick timing. Not 2,400 simultaneously moving fighters or GPU/Internet benchmarking.

- **7.5 Original low-poly 3D models:** ten committed Wavefront OBJ meshes with common material palette for seven unit archetype families and three building groups; real triangles with hands-editable Blender import/export, not 216 unique faction unit models.
- **7.6 Validated OBJ import pipeline:** strict browser-safe Wavefront OBJ+MTL parser, world-space transforms and material shading, same-origin fixed file paths and regression tests for triangles and malformed assets.
- **7.7 WebGL model integration:** load meshes into actual GPU interleaved vertex buffers for units/buildings, cache static geometry, keep selection/HP UI and bounded fallback proxies for >160 visible units.
- **7.8 Model gallery and asset smoke:** standalone interactive local model viewer; HTTP tests validate asset MIME and delivery; fake-GPU tests exercise mesh draw path and fallback; manual real-browser/GPU validation remains.

- **7.9 Six-faction model identity:** 60 individually generated Wavefront OBJ meshes with geometry and faction palette variations for Humans, Orcs, Dwarfs, Tree Elves, Corrupt Elves and Ursa.
- **8.0 Faction-aware WebGL integration:** faction-owned unit/building mesh selection, exact static localhost paths, generic fallback if loading fails and gallery preview dropdown.
- **8.1 Surface patterns and animation:** six original RGB PPM maps projected onto mesh vertex colors; deterministic idle/walk/attack posing and capped visible-canvas animation refresh.
- **8.2 Rig profiles and asset QA:** six seven-joint procedural body-region profiles, animator reference JSON, 60-file OBJ integration tests and extended localhost asset/authorization checks. Full skinned armatures, UV/PBR and browser visual QA remain.

- **8.3 Individual launch roster art:** 216 new physically separate Wavefront OBJ model files (6 factions × 36 archetypes), each with additional role-specific 3D equipment and details.
- **8.4 On-demand integration:** safe exact-path roster serving, browser-selected model-gallery previews and asynchronous limited-batch 3D client loading with previous family-model fallback.
- **8.5 UV-authored geometry:** each new OBJ contains actual Wavefront `vt` coordinates and face texture indices, validated by the parser; original faction PPM patterns sampled by UV and baked into vertex RGB in the prototype.
- **8.6 Animation clips and QA:** three reusable artist-editable seven-joint keyframe animation curves, model-rendering/pose tests, all-216 asset/UV integrity tests, 36 representative localhost HTTP checks. No skinned FBX/glTF or per-pixel PBR yet.

- **8.7 Exportable skinned glTF:** real glTF 2.0 export pipeline for six faction Swordsman exemplars, with seven skin joints, JOINTS_0/WEIGHTS_0, inverse bind matrices, three quaternion animation clips, embedded original PNG and PBR material metadata.
- **8.8 glTF skinning integrated:** client-side glTF parser and CPU skeletal skinning with live RTS/gallery loading, exact localhost endpoints and OBJ fallback.
- **8.9 GPU UV texture sampling:** separate WebGL diffuse shader samples faction PPM textures per-fragment, GPU-texture caching and RGB fallback for legacy meshes; no full physically-based lighting.
- **9.0 QA and downloadable assets:** validates export and dynamic skinning of all six glTF exemplar models, fake GPU shader drawing, real localhost delivery, complete old milestone suite and GitHub Actions artifact of six generated files. Remaining 210 roster units still OBJ.

- **9.1 Expanded glTF export:** 36 skinned glTF 2.0 humanoid models (six factions × Worker, Swordsman, Archer, Pikeman, Healer and Hero), generated on demand and packaged in CI artifact.
- **9.2 Skinning and transitions:** dual-joint influences for many vertices, normalized four-slot runtime skinning, 160 ms quaternion clip crossfades, retained OBJ fallback.
- **9.3 Faction materials:** reproducible 128×128 patterned surface textures, embedded PNG glTF materials, role-specific roughness/metallic metadata and GPU UV sampling for skinned units.
- **9.4 Export and regression QA:** all 36 model exports and 12 localhost sample glTF endpoints validated, runtime blended animation verified. Remaining 180 roster units not skinned; no real-browser GPU pixel validation.

- **9.5 Expanded humanoid glTF coverage:** 96 seven-joint skinned glTF assets (16 land roles × six factions), validated and exportable; non-humanoid roles remain unique OBJ models.
- **9.6 Specialized vehicle motion:** per-domain naval rocking, aircraft banking/hovering and siege firing recoil, applied to OBJ mesh vertices without changing simulation.
- **9.7 Actual browser screenshot smoke:** headless Chromium with SwiftShader checks model gallery, skinned meshes, vehicle fallback and start-screen client; screenshots uploaded to CI.
- **9.8 Artifact pipeline QA:** export/validate and upload 96 skinned glTF models, preserve earlier art milestone tests and document hardware/browser limitations.
