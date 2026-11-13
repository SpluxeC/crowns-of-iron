# Crowns of Iron — Milestones 4.7–5.0

**Scope:** incremental deterministic RTS mechanics and a minimal GPU-rendered 3D browser preview. Not production gameplay or networking.

## 4.7 — Congestion rerouting

When opt-in collision is enabled before the first tick, blocked move orders periodically attempt occupancy-aware deterministic BFS replanning. An occupied destination remains queued until free. Default collision-off simulations preserve prior benchmark behavior. This does not solve multi-agent deadlocks, large physical footprints, dynamic congestion flow or formation cohesion.

## 4.8 — WebGL 3D preview and camera

The browser inspector cycles **top-down → isometric 2.5D → WebGL 3D → top-down**. The WebGL mode uses GPU shaders, depth testing and block geometry for tiles, buildings and unit proxies. Drag to orbit and scroll to zoom. Terrain picking chooses the nearest projected tile center. If WebGL is unavailable, top-down remains usable.

This is actual minimal 3D rasterization, **not** textured meshes, skeletal animations, lighting, advanced cameras, polished controls, or finished game art. Browser rendering and clicks require manual visual QA beyond the tested projection mathematics.

## 4.9 — Local pre-match lobby

`new MatchHost(players,seed,{requireReady:true})` blocks commands and time advancement until all token-authenticated players mark ready, then only the first participant may launch. Default construction retains legacy immediate start. HTTP loopback supports `GET /lobby`, `POST /lobby/ready` (`{"ready":true}`) and `POST /lobby/start`; set `REQUIRE_READY=1` before running `npm run protocol-server`.

These endpoints are local-development controls only. No public account authentication, invitations, matchmaker, WebSockets, TLS or server-client token distribution.

## 5.0 — Checkpoint / restore

`host.checkpoint()` creates a JSON checkpoint with match save, host version, up to 5000 event metadata records, player sequence positions and readiness state. `MatchHost.fromCheckpoint(encoded)` verifies accidental-corruption checksums and regenerates **all session credentials**, preserving the requirement for monotonically increasing authenticated command sequences. The caller must privately distribute new tokens. Checksums are not cryptographic authentication; there is no production database, durable storage, intrusion resistance or host auto-recovery.

## Verification

```bash
npm test
npm run validate
npm run syntax-check
npm run batch-4.7-demo
npm run inspect
```

Tests cover congestion detours and waiting, camera projection/picking, lobby authorization, and checkpoint integrity/credential rotation. The WebGL inspector itself needs human browser QA.

## Follow-up

True multi-unit congestion/formation system, production 3D assets and camera ergonomics, dedicated-server deployment and secure matchmaking, player UI, save persistence and balance playtests.
