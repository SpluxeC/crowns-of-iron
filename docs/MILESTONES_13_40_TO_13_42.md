# Crowns of Iron — Milestones 13.40–13.42

## 13.40 — Large-army tactical lookup optimization
- Index live enemy targets by composite owner/unit ID once per AI army decision.
- Replace a full enemy-roster scan for each pre-existing attack order and a second full scan for each previously assigned target with constant-time map lookups.
- Preserve deterministic unit and target ordering, per-unit pathfinding validation, saturation penalties, target score, defensive posture and all manually issued commands. This is a CPU-cost optimization, not a claim of better combat win rates.

## 13.41 — Sustained resource logistics indexing
- Build per-resource arrays of currently walkable nonempty harvest deposits once per AI economic decision instead of scanning every map tile separately for every resource priority.
- Sort *copies* of each resource bucket by the same worker-distance and coordinate tie-breaker as the existing implementation. Preserve authoritative path/harvest validation, depleted-resource cleanup, mandatory tech shortages, age locks, finite resource supply and delivery rules.
- The AI receives no free resources, workers or buildings.

## 13.42 — Bound mobile WebGL framebuffer footprint
- Use one shared, browser-safe framebuffer dimension helper for canvas sizing, retaining the full-screen CSS battlefield and overlaid landscape controls.
- Apply the existing 2048-pixel edge cap plus a 1.5-million-pixel mobile render-target budget (3 million on desktop). The downsampling keeps the viewport aspect ratio.
- This caps large-screen rendering memory and fill-rate pressure; it is not a physical device benchmark or confirmation of smooth frame rate on every phone.
- Add regression tests for maintained attack orders and removal of destroyed targets, viable resource indexing, unchanged resource balances at assignment, and mobile render-target aspect/budget.
- Release version 13.42.0. Require Node tests, headless scenarios, mirrored faction benchmark, full match matrix, Chromium smoke and playtest package before merge.
