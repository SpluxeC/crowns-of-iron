# Crowns of Iron — Milestones 2.7–3.0

All features below are **headless simulation prototypes**. They do not turn the project into a complete or publicly deployable game.

## 2.7 — Additional executable technology effects

The reconciled v0.2 data still contains exactly **90 technology records per faction**, 12 mandatory age progress discoveries and 78 optional technologies.

There are now **52 of 78 optional technology IDs with executable typed handlers**, or 312 faction-tech instances across six civilizations. The remaining **26 optional technologies per civilization (156 instances)** are still declarative/unfinished.

Fifteen newly typed effects are:
- `ECO-02`: accelerated Worker cargo drop-off handling in spatial mode.
- `ECO-10`: +8% Worker carried-resource capacity.
- `NAV-09`: +5% heavy steamship travel speed.
- `AIR-02`: +10% Scout Aircraft vision in the preliminary network view.
- `AIR-08`: +8% Bomber damage against structures.
- `SPC-07`: +5% recoverable mechanical building salvage.
- `SPC-09`: +10% eligible mechanical repair throughput.
- `FAC-07`: +5% late industrial production throughput.
- `FAC-08`: +8% eligible siege-unit attack.
- `BLD-01`: +8% owned building max HP.
- `BLD-06`: +10% eligible masonry building max HP.
- `BLD-08`: +10% eligible industrial fortification max HP.
- `BLD-09`: +10% eligible steampunk fortification max HP.
- `FAC-03`: +5% eligible basic building max HP.
- `FAC-10`: +8% eligible fortification max HP.

Owned completed buildings receive applicable research HP changes, including on new construction and later research. Calculations keep missing HP constant (no passive regeneration), and preserve interaction with local reinforcement upgrades. Modifiers use additive technology stacking unless specified otherwise.

The remaining pending technologies are **not** falsely labeled as implemented.

## 2.8 — Functional gates and wall traversal

Gates (`Primitive Gate`, `Stone Gatehouse`, `Industrial Gate`, `Powered Gate`) now have explicit open/closed state and an authenticated owner-only `gate` command. Walls block ground movement. Open, completed gates let allied ground units cross their reserved footprint while enemies cannot. Closed gates block everyone.

Gate UI, animation, opening duration, garrison passage rules, actual wall battlements, specialized siege-tower interactions and open-gate tactical automation remain unfinished. The direct map BFS helper is deliberately terrain-only; military orders use the new owner-aware navigator.

## 2.9 — Land, naval and air movement

Movement classes now differ:
- Land units travel on passable ground and through open friendly gates, never on water or impassable hills.
- Naval units travel only across contiguous water. A new vessel can spawn only near a valid water tile beside the producing facility; if no legal launch point exists it stays unplaced.
- Air units can cross water, hills and occupied ground tiles.

The rules are deterministic and validated by command tests. Naval docking, coast-aware construction requirements, ship-to-ship collision, water depth, flight altitude, aircraft landing, and full sea-lane map generation are still incomplete.

## 3.0 — Spatial economy AI

When spatial economy mode is enabled, AI opponents automatically select reachable finite deposits, assign unoccupied Workers, and collect/haul resources to delivery points instead of relying on abstract income. Resource availability, age restrictions, worker ownership, deterministic priorities and active construction assignments are checked.

The original abstract economy remains the default and unchanged for numerical balance comparisons. Spatial economy AI is experimental: full 8-player competitive build orders, economic emergency handling, worker combat retreat, markets/renewables, mining animations and large-map navigation are future work.

## Reproducible checks

```bash
npm test
npm run validate
npm run full-data-demo
npm run spatial-demo
npm run advanced-demo
npm run inspect
```

All but `inspect` are headless automated commands; `inspect` launches a local browser inspector and should be reviewed manually.

## Next priorities

Complete coast-aware docks and map generation, event-driven wall/gate attacks, naval air combat target rules, the 26 remaining optional tech mechanics, the 66 non-executable local upgrade records and production networking. The final 3D browser client remains a separate substantial workstream.
