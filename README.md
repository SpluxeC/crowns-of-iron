# Crowns of Iron

A five-age fantasy RTS with Humans, Orcs, Dwarfs, Tree Elves, Corrupt Elves, and Ursa.

## Status
**Headless simulation plus interactive 2.5D browser prototype, milestones 0.1–4.6.** This is not a playable 3D game or tested network multiplayer. Work is isolated on a development branch for review.

## Requirements
Node.js 22+. No package installation or external runtime dependencies.

```bash
npm test
npm run demo
npm run validate
npm run inspect       # local 2D browser inspector (not the final game)
npm run map-demo
npm run protocol-server # local-only match API foundation
npm run ai-demo        # deterministic economy-AI benchmark
```

## What's included
- Deterministic tick-based simulation, seeded RNG, replayable commands and snapshots.
- Six-resource stockpiles, gathering, farms, foresters and limited late-game recovery.
- Population, recruitment, production queues, hero and legendary limits.
- Shared research locations, twelve mandatory discoveries, auto age-up, cancellation/refunds.
- Direct damage, type counters, active healing, mechanical repair, burning/corruption.
- Last Stand and Conquest elimination scaffolding.
- Economy-only AI with Easy/Normal/Hard pacing and automated early research.
- Objective-score cores for Great Monument, King of the Hill, and Timed Score.
- Versioned checksum-validated save/load and normal-command replay recording.
- Tactical tile movement, active construction, faction hero abilities, local match protocol and 2D movement/attack inspector.
- Starter unit catalogs and authoritative balance constants, with provenance notes.
- Node built-in unit/integration tests and GitHub Actions.

Review [the milestone plan](docs/MILESTONES.md), [new milestone boundaries](docs/NEXT_MILESTONES.md), and [current limitations](docs/KNOWN_LIMITATIONS.md) before merging. The full v0.2 roster and technology effects will be imported in a subsequent data-integration milestone; this prototype intentionally does not pretend to contain all 216 final unit definitions.

## License
No license has been granted yet; all rights reserved pending an explicit licensing decision.

## Current 1.0–1.4 feature batch
See [milestone verification and limitations](docs/MILESTONES_1_0_TO_1_4.md). The local developer protocol server is available via `npm run protocol-server` and listens on loopback only. This is not a publicly secure multiplayer game server.

The full reconciled v0.2 numeric data can be loaded from `data/balance-v0.2.json` if that generated file is present. The runtime continues to use shared unit templates unless the full data catalog is explicitly loaded. The canonical 216 unit names and faction modifiers are embedded in `src/factionRoster.js`.

## Milestones 1.5–1.8
The reconciled six-faction data is now committed in `data/balance-v0.2.json`; run `npm run full-data-demo` to exercise the installed research and unit definitions. See [full data limitations](docs/FULL_DATA_RUNTIME.md). Additional systems include finite deposit harvesting, ruin salvage and discounted reconstruction, and protocol safety improvements. These do not yet constitute a complete 3D multiplayer game.

## Milestones 1.9–2.2
Executable optional technologies (37 shared tech IDs), three supported building-upgrade types, building siege damage and material-funded worker repairs are now in the headless simulation. Detailed support boundaries are recorded in [Milestones 1.9–2.2](docs/MILESTONES_1_9_TO_2_2.md). Unsupported tech and upgrades are **not** represented as implemented.

## Milestones 2.3–2.6
All 38 canonical structure names per faction can be constructed with the expanded data-backed system (the original 14 prototype definitions still override overlapping workbook values for compatibility). The simulation supports 60/126 local upgrade records, an opt-in finite cargo-and-delivery economy, and obstacle-aware ranged firing positions with line-of-sight checks. Use `npm run spatial-demo` to verify cargo hauling. See [milestone details and limitations](docs/MILESTONES_2_3_TO_2_6.md). The default economy remains abstract until spatial AI/UX is implemented.

## Milestones 2.7–3.0
The executable optional technology handlers now cover 52/78 research IDs per faction. Explicit open/closed allied gates, distinct land/naval/air navigation and optional autonomous spatial harvesting bots are integrated. Run `npm run advanced-demo` for a repeatable fixture. See [Milestones 2.7–3.0](docs/MILESTONES_2_7_TO_3_0.md) for gameplay limitations and unfinished research/production networking.

## Milestones 3.1–3.4
The prototype now includes opt-in connected coastal maps, coast-only Docks/Shipyards, staffed defensive towers/garrisons, **60 of 78 executable optional technologies per civilization**, renewable Farm/Forester/Aether production in spatial economy mode and deterministic army AI stances. Run `npm run batch-3.1-demo` for a reproducible smoke test. See [Milestones 3.1–3.4](docs/MILESTONES_3_1_TO_3_4.md) for implementation scope and remaining limitations.

## Milestones 3.5–3.8
Opt-in connected island sea lanes, finite ship fishing and completed dock-to-dock trade, naval-vs-land/air attack eligibility, **70 of 78 executable optional technologies per faction**, group formation and siege orders, and local authoritative snapshot resynchronization with reconnect-token rotation. Run `npm run batch-3.5-demo` and review [Milestones 3.5–3.8](docs/MILESTONES_3_5_TO_3_8.md). Eight optional tech effects per faction and full transport boarding, real network multiplayer, unit collision and the complete 3D game are still unfinished.

## Milestones 3.9–4.2
Real population-counted transport boarding/unloading, Siege Tower passenger ramps and defensive garrison assaults, **78 of 78 executable optional research handlers per faction** (prototype interpretations), and atomic authenticated local command batches with enhanced state filtering. The full 3D game, production networking, real collision, faction-specialized upgrades and complete gameplay balance remain unfinished. Run `npm run batch-3.9-demo` and consult [Milestones 3.9–4.2](docs/MILESTONES_3_9_TO_4_2.md) for exact coverage.

## Milestones 4.3–4.6
All **126 local faction building-upgrade records** now have executable prototype effects. Opt-in collision separates ground/sea units and blocks destination stacking; eight-player/2,400-population in-process host stress and extra loopback reconnect/batch endpoints are included. The browser inspector now has a selectable isometric 2.5D view and group movement controls. Run `npm run batch-4.3-demo` and `npm run multiplayer-stress-demo`; use `npm run inspect` to try the UI. See [milestone details and limitations](docs/MILESTONES_4_3_TO_4_6.md). This is **not yet a full 3D or production multiplayer game**.
