# Milestones 1.9–2.2 — Executable tech, building upgrades and structure combat

This batch extends the deterministic headless RTS prototype; **it is not a finished playable 3D RTS**.

## 1.9 — Executable research modifiers

- `src/technologyEffects.js` defines 37 distinct optional technology IDs with typed handlers; the 12 mandatory research nodes continue to work through the age-gate engine.
- 37 optional modifiers include resource gathering, additive non-compounding attack/HP/speed boosts, active healer output and Town Center housing.
- Existing units update upon research completion; subsequently trained units inherit the same unlocked bonuses.
- HP tech maintains an injured unit's absolute missing-HP amount rather than restoring health for free.
- `technologyEffectStatus` and `executableCoverage` expose the remaining unsupported technology descriptions.

**Coverage:** 37 of 78 optional technologies per faction currently have an implemented typed effect. 41 optional technology descriptions per faction remain pending, i.e. **246 pending faction-tech effects** across all six civilizations. This is a partial milestone, not a claim of 540 individually implemented effect mechanics.

## 2.0 — Building-specific upgrades

- Parses and catalogs all 126 local upgrades from `data/balance-v0.2.json`.
- Adds per-building upgrade purchase/cancel queues, completion timers, ages, affordability, player ownership, no duplicate purchases and destruction refunds.
- Three currently executable upgrade types: `Training Equipment I` (Barracks −10% training time), `Reinforced Barracks` (+15% max building HP), `Assembly Equipment` (additional 5% training-time reduction).
- These three upgrade types appear for six factions (18 data rows). All other local-upgrade descriptions remain cataloged but cannot be purchased until they have implemented handlers.
- No automatic HP regeneration is added. Building reinforcement preserves prior damage.

## 2.1 — Building damage and destruction

- Units may issue `attackStructure` against a completed enemy building when already in weapon range.
- Attack eligibility, ownership, weapon intervals and the shared Armor/counter-damage formula are checked.
- Damage is applied to building HP; destroying an eligible building leaves a five-minute ruin that can be salvaged or rebuilt.
- Only the already implemented buildable structure subset participates. This is *not* full destructible walls, gates, shipyards or monument combat.
- Structure attack orders currently do not auto-path around obstacles or use true line-of-sight/projectile simulation.

## 2.2 — Worker repair and action-cooldown enforcement

- Adjacent workers can repair a damaged owned building in bounded 40-HP per-worker actions, using proportional repair-material costs (60% material replacement basis).
- Repair orders validate worker identity, ownership, reach and two-second cooldown.
- Healers and mechanical-unit repair workers also receive per-action two-second cooldown checks, eliminating unbounded command spam.
- The local match host validates target visibility for building attacks and still restricts direct unscheduled remote healing/repair commands.

## Automated verification

Run `npm test`, `npm run validate`, `npm run demo`, `npm run full-data-demo`, and `npm run syntax-check`. GitHub Actions executes these checks on the milestone branch.

## Remaining priorities

1. Implement the remaining 41 optional technology effects per civilization, with controlled prerequisites and realistic balance evaluation.
2. Implement the other 108 local building-upgrade data rows and finish 38 building roles per faction.
3. Add real unit/building collisions, attack/path geometry, reliable field hospital logic, active worker positioning and artillery/air combat constraints.
4. Replace abstract automatic gathering with authenticated spatial harvesting/hauling while keeping time-slice deterministic.
5. Upgrade the local HTTP protocol to a production server with match lifecycle, reconnect, transport authentication and interest management.
6. Build the full 3D browser client and mobile controls, then conduct actual gameplay balance tests.
