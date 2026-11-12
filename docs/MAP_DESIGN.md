# Deterministic procedural map foundation

This milestone implements an **abstract square-grid map**, not the production 3D terrain renderer.

- Seeds reproduce terrain and resource positions exactly.
- 2–8 players are positioned around the center.
- Early Food, Wood, Stone, Metal and Gold deposits are guaranteed within a few tiles of every spawn.
- Wooded and hilly terrain use finite abstract deposits.
- Guaranteed clear paths lead from every start to the center.
- Building placements snap to tile coordinates, reserve footprint cells, and reject water, hills, deposits or overlapping structures.
- A four-direction BFS pathfinder checks reachability without permitting diagonal corner clipping.
- Map sizes 32–128 tiles are supported, with building ownership but no territory restrictions yet.
- Physical sea lanes, coast-adjacent Docks, rivers, flight routes, navmesh, eight map themes and true balanced asymmetry need further work.

Run `node scripts/map_demo.js` for an ASCII preview.
