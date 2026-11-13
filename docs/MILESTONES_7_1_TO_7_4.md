# Crowns of Iron — Development Milestones 7.1–7.4

**Scope:** deterministic authoritative RTS prototype, declarative proxy assets, local HTTP delivery smoke checks and a headless CPU profile. Not a complete released RTS, finished artwork, automated real-browser visual QA or public matchmaking.

## 7.1 — Attack-move and combat stances

The server supports authenticated `attackMove` and `stance` commands with owner/liveness checks, valid tile bounds and attack-capability validation. An attack-move unit routes toward a designated tile, acquires the closest valid visible enemy within a four-tile radius (deterministic distance and identifier ordering), attacks, then resumes toward the destination after that target dies. Defensive combat behavior is explicit:

- **Hold fire:** no autonomous acquisition; explicit attack and attack-move commands still function.
- **Guard:** automatically acquires eligible enemies already within weapon range and disengages if they leave that range.
- **Aggressive:** automatically acquires nearby eligible enemies within four tiles and pursues with the existing combat targeting/path system.

Idle units do not auto-acquire by default, preserving previous behavior until the player sets a stance. The browser offers **Attack-move** and **Apply stance**, with up to 16 individually validated units in a single atomic host batch. Network authorization remains server-side; no guessed enemy coordinates are sent by the interface.

**Limitations:** no cover-aware AI, combat stances beyond these three, attack-move across 24 units in one command, formation-level coordinated targeting, proper target reservations, unit animation, or full collision deadlock resolution. The four-tile auto-detection policy is an initial gameplay tuning value and needs match balancing.

## 7.2 — Versioned proxy asset manifest

`web/assetManifest.js` now declares seven stable, versioned unit proxy families (worker, infantry, ranged, hero, siege, naval and aircraft) and three structural profiles (civilian, defensive, tower). The WebGL renderer derives silhouette geometry from this module instead of embedding all role classification inside the renderer. Registry validation tests enforce stable IDs and sensible dimensions.

**Limitations:** this is a *procedural asset interface*, not imported, licensed glTF/FBX production art, an animation controller, an automatic asset import pipeline or completed 3D character designs. Binary assets and GPU resource management for external meshes are future work.

## 7.3 — Local browser delivery and gameplay command smoke

`src/browserDeliverySmoke.js` starts a real loopback HTTP server, fetches the client HTML and every required JavaScript module, checks that HTML command controls and module dependency URLs are served, confirms CSP headers, verifies anonymous access rejection and issues an authenticated atomic stance command over HTTP. The tests also confirm private opponent economy fields remain hidden. Run `npm run browser-delivery-smoke` for the standalone report.

**Limitations:** this is a browser **delivery/HTTP contract check**, *not* real Chromium/Firefox/Safari interaction automation. It does not assert that a user can successfully drag-select on their hardware or that rendered WebGL pixels match expectations.

## 7.4 — Headless 2,400-unit movement profile

`src/largeArmyMovementProfile.js` constructs an authoritative, collision-enabled eight-player match on a 128 × 128 all-grass benchmark map. It places **300 units per player (2,400 total)** into disjoint map regions, issues **64 distinct attack-move orders** (eight per player) and advances a configurable number of deterministic one-second ticks. It validates zero overlapping occupied positions after each tick and reports p50/p95/worst CPU wall-clock duration. Run `npm run large-army-profile`.

**Limitations:** 64 moving units and 2,336 other standing units, not 2,400 simultaneously navigating or fighting. The benchmark map removes terrain choke points and economic workload complexity. Tick durations depend on CI hardware and are *observational*, not shipping performance guarantees. No real network clients, GPU frames, game-mode completion or full-match profiling.

## Verification and manual QA

```sh
npm test
npm run validate
npm run syntax-check
npm run browser-delivery-smoke
npm run large-army-profile
npm run batch-7.1-demo
npm run protocol-server
```

Manual testing: launch the loopback-only client at `http://127.0.0.1:5190/client` with fresh development session tokens; select an armed unit, set Guard or Aggressive, send Attack-move to a valid reachable tile, verify it pauses to attack nearby enemies and resumes afterward, then verify Stop overrides the current order. Try 2D selection and WebGL orbit and inspect the distinct role proxies. Check for browser console errors on real hardware.

The same safety limits remain: localhost-only development credentials, no public TLS/account service or matchmaking; checkpoints require explicit restore/reset and token rotation. Review stacked PRs in order and do not equate headless success with a playtested production game.
