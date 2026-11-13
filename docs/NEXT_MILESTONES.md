# Milestones 0.7–0.9 — Simulation Extensions

These features extend the existing **headless prototype**. They do not provide finished single-player gameplay or live multiplayer.

## 0.7: Economy AI
`src/ai.js` introduces a deterministic economy/research bot with Easy, Normal and Hard decision cadence and workforce targets. Bots can recruit Workers, gather, and research the four mandatory age transitions using the existing match rules. AI tactical attacks, hero powers, map strategy and team diplomacy remain unimplemented.

## 0.8: Victory mode scoring
`src/modes.js` implements the timing/scoring cores of Conquest, Great Monument (15-minute hold), King of the Hill (10-minute uncontested control) and Timed Score (45-minute default). Zone presence, monument construction and objective control are **trusted simulation events**, not authenticated external player actions. Actual objective spatial capture, map validation, construction costs and structure destruction are prerequisites before multiplayer release.

## 0.9: Persistence and replay
`src/persistence.js` adds versioned JSON save/load with an **accidental corruption checksum**, plus deterministic in-memory event recording/replay of normal commands and ticks. The checksum is not cryptographic authentication. The save/replay system lacks snapshots of external authoritative server actions, migration, battle event logs, and verified input signatures. Replays with bot setup/mode changes must record those configuration events in a future version.

### Existing limits
- No 3D engine, path-based army AI or client/server transport.
- Research has twelve playable mandatory nodes; the full 540-row catalog has an external importer and is not automatically connected to matches.
- Conquest viability is an early model; territorial reachability and resurrection/reconstruction are still future milestones.
- The browser interface remains a 2D development inspector.
