# Milestones (branch: milestones/0.1-0.4-core-simulation)

- **0.1 Foundation:** ESM modules, schemas, deterministic seeded random, serialization; included.
- **0.2 Economy and research:** six resources, worker output, farm/forester/recovery, 12 mandatory discoveries, research queues; included as first-pass rules.
- **0.3 Production and combat:** cost reservation, population, hero/legendary uniqueness, damage counters, healer and repair rules; included as first-pass rules.
- **0.4 Match execution:** deterministic commands and ticks, Last Stand, Conquest scaffolding, tests, demo, CI; included as first-pass rules.
- **0.5 Data pipeline:** standard-library XLSX importer and six-tab validation into JSON; code included. Generated data file must be imported from the provided workbook before runtime integration; ability kits not included.
- **0.6 Map + inspection preview:** deterministic tile map, nearby-resource parity, grid placement and 2D browser inspector included; full 3D camera/renderer and actual unit path movement not included.
- **0.7 Multiplayer:** server-authoritative command validation, reconnect, synchronization; **not included**.
- **0.8–1.0:** full six-faction abilities, game modes, mobile controls, balancing and release pipeline; **not included**.

The code uses simplified shared archetype data to exercise gameplay rules. Do not infer combat balance from this prototype without positional combat, faction powers, and representative populations.
