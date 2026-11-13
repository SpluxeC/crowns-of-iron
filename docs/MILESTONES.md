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
