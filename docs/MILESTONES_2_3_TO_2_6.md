# Crowns of Iron — Milestones 2.3–2.6

**Status: headless prototype implementation, not a completed RTS.** This batch builds on PR #5 and all earlier development branches.

## 2.3: Expanded building catalog
- All **38 canonical structure entries per faction** from the reconciled v0.2 JSON are now parsed and available for construction (228 faction-specific rows).
- Structures outside the earlier 14 shared prototypes use faction-specific ages, costs, Armor, HP, footprint and build times from the workbook.
- To preserve compatibility with earlier simulation tests, the original 14 shared structure types retain their existing prototype definitions and footprints when there is overlap; the reconciled definitions remain accessible in the complete catalog. This is intentionally **not** yet a perfect 228-row numerical runtime replacement.
- Includes additional walls, gates, defenses, naval infrastructure, the recovery plant, Aether Condenser and Great Monument entry. Dock/coast placement, functional wall blocking, gates, garrison combat, Monument resource-controlled victory and specialized building actions are not yet all implemented.
- Great Monument destruction explicitly does not create a discountable ruin. Completed Great Monuments update the early Great Monument timer.
- Full production identity and location constraints for every newly available structure still need review.

## 2.4: Expanded executable local building upgrades
- Reconciled data contains 21 local-upgrade types per faction (126 rows).
- **10 upgrade types × 6 factions = 60 executable rows** now support building HP, training speed or housing changes. The remaining 66 rows are tracked but cannot be purchased.
- Newly implemented: Extended Housing, Reinforced Command Hall, Training Equipment (Archery Range), Heavy Assembly, Advanced Slipways, Reinforced Ramparts and Automatic Feed.
- Existing: Barracks Training Equipment I, Reinforced Barracks, Assembly Equipment.
- Training upgrades combine additively, with a maximum local training-time reduction of 25%.
- The initial free Town Center remains an abstract entity rather than a physically placed building site, so upgrading that specific starting instance requires the future initial-site representation.

## 2.5: Opt-in spatial worker economy
- `setEconomyMode(match,"spatial")` must be called before simulation starts, with a battlefield attached.
- Worker harvesting is job-based: workers path to actual finite deposits, pick up up to 30 cargo units in periodic actions, return to the initial Town Center location or a completed Resource Depot, and only then credit the player's resources.
- Direct instant-credit `harvest` commands are disabled in spatial mode; passive abstract worker gathering is also disabled, preventing resource duplication.
- Worker ownership, resource age restrictions, reachability, cargo limits, depletion and deposit delivery are validated.
- The old abstract economy remains the **default** for compatibility with existing economic balance tests and economy AI. Autonomous AI harvesting, advanced resource transport, resource storage capacity, player harvesting controls and UI are unfinished.
- `npm run spatial-demo` provides a nonvisual example.

## 2.6: Ranged engagement and line of sight
- Hills and constructed building footprints now obstruct direct ranged attacks.
- Units search for a reachable attack position within range and with clear line of sight instead of always pathing to a target tile.
- The same obstruction rule blocks issuing and completing an impossible ranged structure shot.
- No physical projectile physics, ballistic arcs, directional cover, infantry collision/formation avoidance, naval navigation or aircraft air-layer pathfinding yet.

## Verification
```bash
npm test
npm run validate
npm run demo
npm run ai-demo
npm run full-data-demo
npm run spatial-demo
npm run syntax-check
npm run inspect
```
The last step is a manual browser-inspector check; the rest are runnable without graphics.

## Next recommended work
Complete dock and naval placement/navigation, initial Town Center placement, full spatial harvesting AI, remaining local upgrade systems and all remaining technology effects. Then implement authoritative multiplayer simulation with actual fog/vision, pathing, buildings and performance tests before a production-ready 3D browser client.
