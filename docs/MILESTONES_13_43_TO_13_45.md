# Crowns of Iron — Milestones 13.43–13.45

## 13.43: Armed-threat-only defensive targeting
- Defending AI squads reject unarmed targets and worker/civilian targets, even in older legacy matches without the full faction catalog.
- Previously the defensive stance filter only enforced this restriction in the full-catalog squad objective; the fallback per-unit order planner could still select enemy workers within the base-defense radius.
- Offensive/raid behavior and legal attack-domain, route validation and human-issued orders are unchanged.

## 13.44: Mandatory research shortages first
- Idle spatial-economy workers now consider depleted mandatory age-research inputs before ordinary optional priorities. Among shortage inputs the existing scored resource order remains deterministic.
- A worker already carrying cargo remains excluded. Rebalanced workers retain the prior forced-resource rule and 20-second threshold. Pathfinding and age restrictions still validate the actual gathering action.
- No costs, resource contents, or faction unit stats are altered; this only chooses existing deposits more appropriately.

## 13.45: Strict mobile framebuffer allocation limits
- Round canvas texture sizes **down** at computed resolution bounds, preventing the two individually rounded dimensions from exceeding the hard 1.5 million-pixel mobile or 3 million-pixel desktop budget.
- The full-screen WebGL battlefield and landscape-only mobile UI remain unchanged. Tests probe boundary viewport sizes and both budgets.
- This is a controlled memory footprint check, not physical hardware benchmark evidence.

## Release gates
Version 13.45.0. Add focused regression tests for legacy defensive behavior, resource input ordering, and strict mobile pixel caps. Require complete Node, headless, Chromium art, mirrored faction and full-match simulations, Pages smoke, and packaging CI success before merging.
