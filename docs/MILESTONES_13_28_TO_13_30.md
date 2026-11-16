# Crowns of Iron — Milestones 13.28–13.30

## 13.28 — Reachable squad focus
- The shared AI target focus now updates to the last successfully path-validated attack assignment. When the globally chosen squad objective is unreachable, follow-on soldiers can coordinate around a target that an earlier soldier actually reached.
- Pathfinding remains capped at 16 candidates per unit, preserving deterministic ordering, weapon-domain checks, and all manual human orders. This is a bounded coordination heuristic, not a full tactical planner.

## 13.29 — Later-age military diversity
- Age III AI recruitment includes Heavy Artillery where a completed Siege Workshop or Foundry can train it.
- Age IV adds Interceptor when an Airship Hangar exists; Age V includes Heavy War Machine and Gunship when their advanced factories are available.
- All added roles use the existing faction-specific age restrictions, recruitment locations, costs, queues, population limits and mandatory research spending protections. No new production building is granted for free and no stats were changed.
- Units enter only when the AI's actual game economy can afford and train them.

## 13.30 — Mobile lifecycle quality safeguards
- Adaptive WebGL quality now uses a safe device pixel ratio when mobile WebView reports zero, negative, nonfinite or unavailable screen scale.
- Discards out-of-order render timing observations, preventing regressed timestamps during orientation/resume transitions from altering the quality controller.
- A manual quality-mode change resets the timestamp guard so a new session may legitimately begin a new timeline.
- New regression tests cover focus advancement, late-age role-to-facility mappings and rendering invalid-input handling.
- Version 13.30.0. Release gates: npm test, full headless simulation, mirrored faction benchmark, seven full matches, playtest packaging, static build and Chromium browser smoke.

Limits: Browser/CI tests are not physical device benchmarks, and local multiplayer development source is unchanged.
