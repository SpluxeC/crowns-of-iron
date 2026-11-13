# Crowns of Iron — Development Milestones 6.7–7.0

**Release classification:** local RTS gameplay/rendering prototype and diagnostic harness. Not public-network multiplayer, complete 3D art, a renderer validated on real devices, or production-scale performance.

## 6.7 — More readable procedural 3D

The existing WebGL scene still uses generated colored cuboids, but now gives Workers a distinct carrying pack, infantry a shield, ranged units a weapon proxy, Heroes and Legendary units a banner, siege units a turret, ships a mast, and air units lateral wings. Player-visible structures have proportional rooflines and defensive structures have differentiated heights/colors. Selected or damaged units show five-pip health indicators in world space. Visual profiles and HP rounding have deterministic unit tests.

**Limitations:** No authored 3D models, skeletal animation, terrain textures, audio, GPU instancing, physics or validated hardware presentation. Structure geometry is an approximation, and static mesh layout on multi-tile rectangular buildings remains a simplified proxy. Fog-filtered input must come from the authenticated server; this renderer does not enforce vision itself.

## 6.8 — Group attack and Stop orders

The browser supports targeting a **visible enemy unit** with up to 16 selected, living, positioned, armed units, sending a single atomic `POST /command-batch` request. It also offers Stop for up to 16 selected living units. The existing `MatchHost.submitBatch` rollbacks ensure that a failed attacker/ownership/visibility check rejects the entire batch; successful batches advance command sequence and authoritative match state. The new `stop` simulation action clears the owned unit's active order but does not destroy the unit or alter resource balance. Existing 24-unit selection/formation limits remain; split large army groups into 16-unit combat command batches.

**Limitations:** Attack is direct target focus fire, not attack-move, patrol, stance, automatic target acquisition, multi-target distribution, or group pathfinding. Server may reject mixed-domain groups if any member cannot attack that domain. The client's visible-target picker is a convenience, not a security filter.

## 6.9 — Browser timing diagnostics

`web/perfTelemetry.js` keeps bounded rolling series of the most recent 120 timing samples and calculates p50/p95 and worst values. The connected browser displays top-down canvas CPU rendering time, WebGL CPU *submission* time, HTTP request round-trip time and terrain buffer rebuild count. The timings are observational and specific to the user's browser. No permanent storage, user information upload or external telemetry endpoint is added.

**Limitations:** WebGL CPU submission does not equal GPU completion or FPS. Browser timing is not guaranteed unbiased and requires manual on-device measurement. It does not measure frame pacing under hardware vsync, thermal throttling or long Internet latencies.

## 7.0 — Real authenticated local HTTP benchmark

`src/localHttpBenchmark.js` creates a localhost HTTP server, issues concurrent per-round `GET /state` requests from up to eight independent authenticated sessions, rejects a missing token, checks that opponents' private resources remain absent, and reports response duration/byte-size p50, p95 and maxima without printing credentials. The default `npm run local-http-benchmark` runs eight players by twelve rounds, for **96 actual HTTP requests**. A smaller configuration is included in automated tests.

**Limitations:** Same-process Node clients and localhost transport, no WebGL work, TLS, WAN jitter/loss, user input delays, remote devices, rate-limiting or sustained soak testing. Measurements are environment-specific, not shipping performance targets.

## Verify

```sh
npm test
npm run validate
npm run syntax-check
npm run batch-6.7-demo
npm run local-http-benchmark
npm run protocol-server
```

For local UI testing, use `http://127.0.0.1:5190/client` with fresh server-issued credentials. Select living combat units, click **Attack selected**, and target a visible enemy; click **Stop selected** to cancel orders. Switch to WebGL to inspect role silhouettes and health indicators. Review client timing in the diagnostics area.

**Security / operations:** localhost-only (127.0.0.1), no public auth service, matchmaking or TLS. Existing checkpoints require explicit reset or restore, with newly issued tokens on restore.

## Remaining work

Real browser automated interaction tests, actual GPU measurements, polished 3D assets, model/animation pipeline, hierarchy-level pathing, attack-move, game-mode indicators, secure remote multiplayer, deployment infrastructure and full balance simulation are all outstanding. This branch stays stacked on prior draft PRs; do not merge in the wrong order.
