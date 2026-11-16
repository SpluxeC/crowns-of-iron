# Crowns of Iron — Milestones 13.10–13.12

Target: browser-local 3D single-player AI skirmish at `https://spluxec.github.io/crowns-of-iron/`. Existing multiplayer development source, faction costs and unit damage values remain unchanged.

## 13.10 — Defensive response and coordinated military objectives

- The AI now evaluates threats near **workers and constructed buildings**, not solely within a fixed radius of its initial Town Center. It can switch into a defensive stance when its economy is threatened.
- `src/botTargeting.js` chooses one deterministic squad objective using projected army center, proximity to threatened sites, exposed enemy workers, and siege-unit threats.
- `src/armyAI.js` uses that objective to focus compatible troops on reachable enemies while keeping the existing weapon-domain, line-of-sight, and path validation rules. Defensive armies stay within reach of threatened locations instead of blindly following enemies across the map.
- The 15-second stance hysteresis remains in place. This is a **coordinated targeting heuristic**, not a complete formation AI or a new combat engine.

## 13.11 — Later-age building development

- The AI building planner now considers **Academies, Siege Workshops and Field Hospitals in Age III; Foundries and Airship Hangars in Age IV; and Grand Factories in Age V**, subject to faction-specific catalog definitions, real building costs, age requirements, worker availability and space.
- Mandatory research budgets are protected from optional building spending as well as military recruitment. Emergency housing remains an exception.
- Existing resource logistics protection remains active: builders cannot place structures over the Town Center drop-off or near-start resource corridors.
- This changes AI **building decision-making**, not age entry costs, production/research speeds, or guaranteed access to later ages.

## 13.12 — Mirrored combat balance diagnostic

- `npm run faction-matchups` simulates **30 headless real-logic matches**: all 15 unique faction pairs, each repeated with their start positions swapped, seeded consistently per pair.
- Each fixture advances to a genuine victory or **480 seconds** of simulation; unresolved games remain flagged as unresolved, and the leading score is recorded separately. The report distinguishes **actual wins** from interim score leaders.
- Reports faction-specific wins, unresolved matches, score leads and progression to Age II. This identifies large disparities but **does not silently modify balance values** based on a small sample.
- The GitHub Pages CI pipeline runs the mirrored matchups before the already-established seven complete-game scenarios, 30-minute timed-resolution test, deterministic replay, static build and real Chromium browser smoke.
- The new `tests/botCoordinatedTactics.test.js` and `tests/botLateAgePlanner.test.js` validate target selection, worker defense and later-age facility selection.

## Validation limitations

These tests exercise the actual simulation with full catalog, spatial economy, and real damage calculation. They are not physical-phone stress tests, player-facing visual playtests, or statistically significant competitive balance certification. Real PvP multiplayer remains a future implementation step.
