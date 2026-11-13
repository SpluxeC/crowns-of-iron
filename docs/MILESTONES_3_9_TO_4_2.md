# Crowns of Iron — Milestones 3.9–4.2

**Status:** Tested, deterministic **headless RTS prototype** only. This batch builds on the unmerged PR #9 development branch. Milestone completion does *not* imply the complete game is playable, balanced, deployed or publicly network-safe.

## 3.9 — Actual transport boarding and unloading

- Transport Ship, Air Transport and Siege Tower now maintain live passenger occupancy, measured in each boarded infantry unit's population. Only the owning player can board or unload eligible land units.
- Boarders must be close to a valid carrier, and capacity includes researched Transport Ship and Air Transport passenger upgrades. Boarded units no longer occupy a battlefield tile and cannot attack, move, be targeted, or simultaneously garrison. **They continue counting toward the player's population limit.**
- Unloading validates all passenger identities and unique safe land tiles before placing any unit, so a failed multi-passenger unload is atomic. Ocean-bound ships cannot deposit troops onto water.
- Transport Ship/Air Transport destruction kills boarded passengers; Siege Tower collapse attempts local evacuation, dealing **35% max HP damage** to survivors, and kills trapped troops. Losses adjust population.
- Tests cover ownership, capacity, ocean unloading, casualty cleanup, simultaneous passengers and research upgrades.

Limitations: passengers do not receive individual transport animations, naval shore-to-shore route AI, coordinated drops, amphibious assaults or aircraft altitude constraints. Transport-carrying units still lack physical 3D collision and sophisticated evacuation.

## 4.0 — All optional technology IDs now have executable prototype handlers

Exactly **90 research records per faction**, with **12 mandatory age discoveries and 78 of 78 optional nodes** exposing gameplay handlers. This is **not 540 unique hand-authored mechanics**; six factions share the 78 effect IDs and their numerical behavior.

Eight new typed effects:
- `MIL-07`: +5% eligible combat experience, with Recruit/Veteran/Elite milestones and additive +5/+10% HP, +4/+8% attack; damage is preserved through promotions.
- `BLD-03`: unlocks staffed Primitive Gate defensive fittings.
- `BLD-04`: gates construction of Reinforced Stone Wall behind researched strengthening.
- `BLD-05`: unlocks owner-selected five-second automatic gate closing.
- `SPC-02`: +5 percentage points to active Converter channel damage tolerance, in an eight-second enemy-infantry conversion channel.
- `SPC-03`: unlocks a Worker-driven Aether survey recording nearby Aether deposit positions; remote player views reveal only surveyed resource identity, not hidden enemy occupants.
- `SPC-04`: unlocks Worker Aether extraction pulses consuming up to eight finite Aether units from adjacent deposits, once per 20 seconds, Age III+.
- `SPC-06`: +10% duration for a ranged artillery disruption action against staffed fortifications, preventing automated garrison fire for the disruption period.

These are **defined prototype interpretations** of previously descriptive technology records. Real UX, international balance, converter immunity tables, reconnaissance discovery rules and tactical disruption visual effects remain to be designed and validated.

## 4.1 — Siege towers and fortified assaults

- A Siege Tower can now carry up to eight population worth of eligible **infantry**, with normal population still reserved. It cannot fire as a direct-attack unit, or load workers, heroes, siege machines, cavalry or legendary units.
- It must stand adjacent to an enemy defensive battlement structure and deploy a ramp for **five seconds**.
- Boarded infantry can then attack identifiable defenders in the *abstract garrison slots* at a fixed two-second attack interval using normal Armor/damage rules.
- Moving the Siege Tower away, losing the target structure, or destroying the tower cancels access. No wall-top pathfinding is added.
- Destroyed Siege Towers attempt to eject passengers nearby and inflict 35% maximum-HP damage; trapped passengers die.

Limitations: tower ramp behavior is an abstract interaction with Watchtower, Stone Gatehouse, Fortress and certain defensive gates, not an animated physical ramp, realistic wall traversal, or a pathable courtyard entrance. Troops cannot automatically cross a still-intact wall.

## 4.2 — Safer, versioned local multiplayer host

- Added **atomic `submitBatch`** with 1–16 server-authenticated commands: rejects stale expected versions and restores command sequencing, events, resources and queues if a later action fails.
- Added a bounded **64 successful commands per player per simulation tick** with explicit payload-size limits, plus existing token rotation, duplicate sequence rejection and full fog-filtered state resynchronization.
- The receipt's checksum is now player-view-filtered instead of exposing a global-match checksum.
- Enemy resource hauling jobs and sea trade jobs are omitted from remote fogged views; enemy garrison identities and local upgrade queues are redacted. Surveyed Aether tiles may reveal resource identity but do not expose hidden units or buildings.
- Host checks enemy conversion targets and siege/battlement target structures for visibility before accepting relevant commands.

Limitations: this is a **local host object/protocol foundation**, not a WebSocket server with TLS, matchmaking, persistent sessions, auth service, authoritative client interpolation, server recovery, distributed synchronization, encrypted communication, true anti-cheat or load-tested public multiplayer. Its rollback strategy clones a small prototype match object; it has not been performance-tested for large-scale games.

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
npm run batch-3.9-demo
```

Use `npm run inspect` for a separate **manual 2D browser-inspector** review. The full 3D game client remains unimplemented.

## Recommended next batch

- Add protected real-world network transport and reconnect/recovery testing around the host, plus load tests at the target eight-player/2,400-population scale.
- Complete collision/formation movement and realistic map layouts with islands and ship routes.
- Implement remaining 66 local building upgrade records and final faction hero/legendary special abilities.
- Build the 3D browser RTS camera, selection, order interaction, scenery and visual/audio presentation, then conduct full live multiplayer balancing and mobile input testing.
