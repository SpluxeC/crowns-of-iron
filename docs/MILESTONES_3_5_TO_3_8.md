# Crowns of Iron — Milestones 3.5–3.8

**Status: headless, deterministic RTS prototype.** These are tested implementation slices, not a complete 3D browser game or a production-safe multiplayer backend. All changes build on the unmerged PR #8 branch.

## 3.5: Island maps, naval combat and resource logistics

- Opt-in `makeIslandMap` builds a central protected land area surrounded by navigable water and a canal connecting it to the continuous coastal sea. It retains starting-position tiles. Deterministic seeds, two to eight players and explicit sea-connectivity checks are tested.
- Adds three finite fish shoals and physical Fishing Vessel catches on nearby water; depleted shoals stop paying Food. `NAV-03` affects eligible catches.
- Trade Ships can be assigned a route between two completed allied coastal docks. They must start at the departure pier, physically traverse connected water, and only earn Gold after reaching the other dock. Returning trips continue automatically; losing either dock cancels the route. `ECO-09`, `NAV-10` and `FAC-14` affect completed-trip revenue.
- Added domain-based combat eligibility: ground melee cannot attack naval units; only designated ranged shoreline units can hit ships; heavy naval artillery can bombard land units and shoreline structures; air targets still require dedicated AA categories.
- Naval economics run only when **spatial economy mode is enabled**, not in the abstract balancing mode.

Limitations: simplified island basin, no true random archipelago/island objective capture, water depth or fleet collision; no fishing animations, onboard garrison interactions, merchant trade diplomacy or sea-lane contest AI. Naval artillery line-of-sight and range remain grid abstractions.

## 3.6: Ten more executable research effects

Of 90 research nodes per faction, 12 mandatory age-gate nodes continue to work, **70 of 78 optional tech IDs have typed handlers**, and **8 optional nodes per faction remain pending**. Newly handled IDs:

- ECO-09: +5% Gold from physically completed sea trade routes.
- MIL-10: +5% active field healing in the current simplified reinforcement system.
- NAV-03: +10% Fishing Vessel catch yield.
- NAV-04: +2 passenger capacity statistic for Transport Ships.
- NAV-05: +5% eligible naval shoreline siege weapon damage.
- NAV-10: +5% completed ship trade Gold.
- AIR-01: reconnaissance vision upgrade in preliminary network visibility calculations.
- AIR-09: +2 passenger capacity statistic for Air Transport (12 to 14).
- SPC-08: +5% active healer output.
- FAC-14: +5% Gold from completed ship trade routes.

Passenger capacity is tracked and research-adjusted on both existing and future transport units, **but actual embark/unload operations remain unfinished**. Reconnaissance and reinforcement effects are prototype interpretations, not a claim of fully designed special systems. Full per-faction uniqueness, tree effect interactions and balance remain unfinished.

## 3.7: Formations and siege approaches

- The `formation` command accepts 1–24 owned, positioned units and gives each a unique reachable destination in a deterministic local pattern around the ordered center. All destinations are checked **before** any order is committed, preventing partial group commands.
- The `siege` command accepts an owned military unit and a completed enemy structure, validates an accessible firing approach, moves toward range and then uses the existing armor/attack-interval structure damage model. Lost and destroyed targets invalidate the order.
- Both orders are accepted by the local authoritative command boundary. A siege attack still requires the correct specialized weapon class.

Limitations: no unit-to-unit collision, actual maintained marching formation, siege tower boarding, projectile arcs, combat stance orchestration or terrain-cost pathfinding. These are order-level prototypes.

## 3.8: Versioned local state resynchronization

- The local `MatchHost` maintains a monotonic state version incremented by accepted actions and server simulation advances.
- `resync({token,afterVersion})` returns the server's current **fog-filtered authoritative snapshot**, checksum, current version and only that player's non-sensitive command metadata since the requested version.
- `rotateToken(token)` invalidates the old 24-byte random credential while retaining the player's command-sequence counter; duplicate commands are still rejected after reconnect.
- Snapshot filtering keeps hidden enemy resources/queues/units outside the client payload. Invalid future revision requests and stale tokens are rejected.

Limitations: local-only development server, not matchmaking, WebSockets, cryptographic transport security, reconnect after persistent server crash, robust session expiry, interest-managed delta streaming or internet-scale anti-cheat. `resync` currently returns full filtered snapshots rather than compressed incremental state.

## Verification

```bash
npm test
npm run validate
npm run demo
npm run ai-demo
npm run full-data-demo
npm run spatial-demo
npm run advanced-demo
npm run batch-3.1-demo
npm run batch-3.5-demo
npm run inspect
```

The last command is a manual browser inspector check; all other commands run headlessly. CI runs automated tests, validation and the scripted demos.

## Recommended next batch

- Make all six factions' final specialist abilities and the final eight optional technology effects executable.
- Add real transport boarding/unloading, convoy targeting and sea-lane objectives.
- Implement formations with collision avoidance and true siege-tower/gate mechanics.
- Build a real multiplayer transport with server authentication, reconnect/load testing and scalable visibility.
- Begin the production 3D browser presentation and systematic live gameplay balance testing.
