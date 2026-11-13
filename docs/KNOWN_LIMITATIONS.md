# Known limitations and design notes

1. **Balance provenance:** Prototype values come from the approved Game Design 3.9 first-pass baselines, but the complete v0.2 Excel data is not embedded yet. Only sample archetypes and mandatory technologies are represented.
2. **Economic model:** Workers harvest from abstract resources at rates; no hauling/pathing or finite per-tile deposits yet. Farm/forester limits and upkeep exist as explicit commands, not physical worker navigation.
3. **Research:** 12 mandatory nodes are implemented, plus generic optional nodes supplied at runtime. The 90-node faction technology trees are not fully installed. Mandatory research cost/time is aligned to reconciled workbook v0.2; the complete optional research catalog remains pending.
4. **Combat:** Damage calculations and unit HP are deterministic; target movement, line of sight, projectiles, pathing, attacks per second and splash geometry are not implemented. Attack frequency must be enforced by the future authoritative order scheduler.
5. **Production:** Simplified elapsed-time queues, pop cap checks and unique unit reservations are implemented. Production building line-of-sight and spawn collision are outside this stage.
6. **Healing:** No passive health regen. Active healer methods and engineer repairs are explicit; specialized abilities are forthcoming.
7. **Browser/terrain preview:** An interactive local 2D inspection page and deterministic abstract terrain are available; neither is the production 3D renderer, complete placement rules, nor actual mobile deployment.
8. **Match ending:** Last Stand is scoped to basic Conquest viability; full Monument, Hill, Timed Score, diplomacy and naval-island edge cases need implementation.
9. **Infrastructure:** No browser rendering, assets, matchmaking, game server, persistence backend, deployment, anti-cheat or console crossplay.
10. **Determinism:** Seeded RNG and integer-millisecond ticks; no floating-point lockstep guarantee across unrelated platforms until a fixed-point math pass.
11. **Open design gap:** Hero support building, hero survival, specialty faction names and full tech effects must be imported from master v1.0 without changing confirmed limits.
