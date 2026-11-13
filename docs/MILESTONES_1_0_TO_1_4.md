# Milestones 1.0–1.4: development feature slice

These are **prototype implementation milestones**, not a finished RTS or public multiplayer release.

## 1.0: Tactical movement and military AI
- Seeded two-dimensional tile battlefield and explicit move/attack orders.
- Manhattan range checks and deterministic attack events; no projectile simulation.
- Basic tactical bot target selection and simple combat movement.
- No collision avoidance between individual units, tactical retreats, formation logic, air/naval path classes, vision/fog or sophisticated threat scoring.

## 1.1: Construction
- Worker-assigned construction requests, costs, age locks and grid legality.
- Construction times with diminishing multiple-worker acceleration.
- Population housing, production facility activation and partial refund rules.
- Stable per-building production channel identifiers, no reuse after destruction.
- No actual worker walking to the site or building-model animation. Repair of completed structures, reconstruction and full 38-building catalog remain pending.

## 1.2: Six-faction identity and hero abilities
- 216 canonical unit names from the reconciled roster (22 land, 8 naval, 6 air per faction).
- Reconciled v0.2 faction stat multipliers applied to shared archetypes.
- Six named hero active abilities with cooldowns, direct damage or finite buffs; no passive HP regeneration.
- Faction-specific passives are identified but not all fully implemented in gameplay logic.
- Detailed complete 540-research numeric data remains in the workbook; imported data may be loaded through the supplied importer but is not yet the default simulation catalog.

## 1.3: Local multiplayer protocol boundary
- In-memory match host with per-player random session tokens, monotonic command sequence, ownership enforced by the server and denial of debug commands.
- Local-only HTTP command/state testing server: `npm run protocol-server`.
- Deliberately does not claim public authentication, lobby/matchmaking, fog-of-war filtering, authoritative attack geometry validation, anti-cheat or production-ready websocket reconnection.

## 1.4: Browser inspector
- Local 2D map with unit rendering, player selection and movement/attack orders.
- Live opponent economy AI, worker construction and training.
- Responsive landscape-friendly layout. Not yet a production 3D browser renderer.

## Verification
```bash
npm test
npm run validate
npm run demo
npm run ai-demo
npm run syntax-check
npm run inspect
```

The first five commands run headless or static checks. `npm run inspect` is a manual browser smoke test.

## Next real milestones
- Migrate complete numeric workbook and 540 technologies into the default runtime.
- Implement all 6×36 specialized unit kits, abilities and production restrictions.
- Real worker navigation and deposits, building ruins and persistent rebuild cost logic.
- Secure server-authoritative positional combat and information filtering.
- Playable complete RTS match on desktop/mobile with 3D presentation.
