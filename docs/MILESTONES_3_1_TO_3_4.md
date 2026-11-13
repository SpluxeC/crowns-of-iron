# Crowns of Iron — Milestones 3.1–3.4

All work in this batch belongs to the deterministic **headless RTS prototype**. Completion below means a tested implementation slice, not production-ready game behavior.

## 3.1 — Connected coastal maps and Dock placement

- Added opt-in `makeCoastalMap({seed,width,height,players})` with a continuous water perimeter and coast pads for all 2–8 players. Unlike the old random ponds, these sea lanes are confirmed connected by `verifySeaConnectivity`.
- All coastal construction (Dock, Shipyard, Advanced Shipyard) now needs a buildable dry footprint with directly adjacent navigable water. This restriction also applies to older random-map mode.
- Ships continue to spawn only where their producing facility has legal neighboring water. They cannot materialize on the ground when the launch area is missing.
- Original `makeMap` remains the default to preserve existing combat and economic benchmarks. To enable naval connectivity, callers must explicitly use `makeCoastalMap`.

Limitations: this is a single connected coastline/perimeter, not a full ocean-basin generator with islands, deep water, sea chokepoints, naval logistics, shore-defense AI or verified competitive map fairness.

## 3.2 — Staffed fortifications, garrison firing and destruction

- Garrison commands can put eligible adjacent infantry into owned completed defensive buildings: Watchtower, Fortress, Stone Gatehouse, Artillery Bastion and Anti-Air Tower.
- Capacity and simultaneous firing slots differ by structure. Staffed defenses target visible in-range enemy units with their own finite shot intervals, armor-based damage and air restrictions. Empty defenses do not shoot.
- `BLD-07` adds a defensive firing slot where garrison headcount permits. This is a real gameplay effect, not just a data flag.
- Garrisoned units cannot be separately moved or directly targeted. They still occupy population. Ungarrison orders return infantry to available adjacent passable ground.
- Destruction releases trapped garrison troops to nearby passable tiles with a 35%-of-max-HP damage penalty; if every adjacent exit is blocked, trapped troops are lost. No automatic garrison healing is introduced.

Limitations: instant embark/disembark is temporary; garrison positioning and combat have no animation, climbable wall tops, siege-tower interactions, directional cover, suppression, or projectile arcs.

## 3.3 — Eight additional typed optional research effects

The research catalog remains exactly 90 nodes per faction, comprising 12 mandatory age gates and 78 optional technologies. Typed implemented effects increase from **52 to 60 optional technology IDs per faction**. The remaining **18 optional tech effects per faction** are still pending.

Added handlers:
- `ECO-05` and `ECO-06`: +10% each to active renewable Farm Food output.
- `ECO-07`: +10% to renewable Forester Wood output.
- `BLD-02`: +5% depot/drop-off handling throughput.
- `BLD-07`: one extra staffed fortification firing slot.
- `SPC-05`: 10% mitigation of active Corruption damage-over-time.
- `SPC-10`: +10% Aether Condenser output.
- `FAC-13`: +5% eligible Aether Condenser output.

Farm, Forester and Aether Condenser resource production is implemented in **spatial economy mode only** at fixed 10-second ticks. This keeps the old benchmarked abstract economy unchanged. These early throughput baselines are **prototype values**, not final economic balance numbers; the buildings currently produce without an assigned operator, and their staffing requirements need design review.

## 3.4 — Improved AI army stances and tactical selection

- Adds deterministic `assault`, `defend`, `raid` and `hold` stances for enabled computer players through the server-side `setArmyStance` API.
- Attackers avoid automatically taking ownership of civilian Worker orders, validate reachable engagement positions, consider anti-air eligibility, and focus enemy threats/Workers according to stance.
- Defend keeps AI combat targeting within a 12-tile radius of its start. Hold cancels bot-issued attack orders, while raid prioritizes nearby enemy Workers. Difficulty controls maximum tactical orders per decision.
- The original economy and research AI remains intact, including spatial Worker harvesting.

Limitations: no coordinated formations, retreat and resupply policies, predictive opponent modeling, or full naval/air fleet strategy. These stances are developer/server API controls, not yet exposed in the final game UI.

## Verification

Run:

```bash
npm test
npm run validate
npm run full-data-demo
npm run spatial-demo
npm run advanced-demo
npm run batch-3.1-demo
```

All commands above are non-graphical. `npm run inspect` still needs manual browser testing and does not represent a finished 3D gameplay client.

## Next recommended batch

Implement true coastal/island map fairness and naval objectives, full garrison/defense balancing, the remaining 18 optional tech mechanics, tactical formation and siege orders, and a production-focused multiplayer architecture. The full 3D browser RTS and mobile support remain separate substantial work.
