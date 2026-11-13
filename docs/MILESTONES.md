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
