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
