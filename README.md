# Crowns of Iron

A five-age fantasy RTS with Humans, Orcs, Dwarfs, Tree Elves, Corrupt Elves, and Ursa.

## Status
**Headless simulation prototype, milestones 0.1–1.4.** This is not a playable 3D game or tested network multiplayer. Work is isolated on a development branch for review.

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
