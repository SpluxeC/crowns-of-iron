# Crowns of Iron — Milestones 5.1–5.4

**Status:** developmental simulation + same-machine connected multiplayer playtest, not a finished RTS.

## 5.1 — Improved group movement and goal assignment

`src/groupNavigation.js` performs one deterministic BFS per member to find routes to up to 25 relative formation slots, then uses a minimum-cost bipartite assignment (route length first, fixed slot index tie-break). It excludes stationary **non-group** same-domain occupants in collision-enabled matches and commits all 24-or-fewer orders atomically. Input order does not affect slot assignment. On-unit movement still uses the previous bounded collision detouring; mutual blocking, multi-unit crossing and full formation cohesion remain unsolved.

## 5.2 — Improved 3D gameplay readability

`web/webgl3d.js` now supports actual camera-ray/top-surface tile intersection for mouse picking, including raised hills. Its GPU geometry shows forest trunks and distinct worker, hero, naval and aircraft proxies, with selection bases. This is still a block-proxy renderer. No detailed models, animation, shadows, sprite atlas, production-quality shader materials or verified large-scale GPU performance.

## 5.3 — Same-origin local event streaming

`src/loopbackProtocol.js` wraps the existing server authority in local HTTP routes and an authenticated `GET /events` Server-Sent Events stream; every notification contains **only a monotonically increasing version**. The browser uses `fetch` with `X-Session-Token` request header, then fetches the fog-filtered `GET /state` snapshot. Tokens are **never** included in event payloads, URLs or browser storage. Rate limits and stream backpressure cap the development service, and browser assets are served from an explicit allowlist with a restrictive CSP. `scripts/server.js` binds **127.0.0.1** only.

This is a local test transport, not WebSockets, Internet hosting, authentication accounts, matchmaking, TLS, automated recovery or production security. Multiple browser tabs on the *same machine* can test distinct player tokens. An operator must share tokens out-of-band.

## 5.4 — Connected browser playtest client

Open `http://127.0.0.1:5190/client` after `npm run protocol-server`. Paste the relevant **dev-only** token printed in the terminal, connect and select units; the client's only actions are server-validated move, formation, attack and Worker train. It shows the lobby, player resources, fogged map, server version, selected units and in-game time. Toggle the WebGL 3D camera or retain top-down. Live SSE notifications drive resync, and interrupted streams retry. The client does **not** run its own economic or combat simulation.

For ready/start setup: `REQUIRE_READY=1 npm run protocol-server` on Unix shells, or `$env:REQUIRE_READY=1; npm run protocol-server` in PowerShell. Each player token is distinct; the first listed participant is lobby host.

## Verification

```sh
npm test
npm run validate
npm run syntax-check
npm run batch-5.1-demo
npm run protocol-server
```

Automated checks cover group assignment/atomic failure, collision interactions, terrain picking, role geometry, authenticated HTTP commands, fogged snapshots, SSE version updates and allowed static assets. A real browser visual and cross-tab interaction pass, network fault-injection, real-host throughput, hostile-client security review, persistence deployment, lobby UX and faction balance testing remain outstanding.

## Next milestones

Scale and optimize dynamic group navigation, improve the renderer's camera and art production, integrate robust multiplayer transport and account authentication for non-loopback hosts, add player-facing building/research controls, and conduct representative RTS gameplay tests.
