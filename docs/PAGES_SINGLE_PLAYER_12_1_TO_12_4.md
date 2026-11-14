# Crowns of Iron — Browser-Only Single-Player GitHub Pages v12.4

**Primary playable target:** GitHub Pages static site at `https://spluxec.github.io/crowns-of-iron/` after the GitHub Pages workflow passes and deployment has been enabled in the repository settings. This URL is only considered live after a successful Pages deployment check.

## Architecture

- The browser hosts the existing RTS `src/simulation.js`, `src/map.js`, spatial battlefield, validated `data/balance-v0.2.json`, faction catalog, and AI opponents in a dedicated ES-module Web Worker.
- Players pick one of six factions, 1/3/5/7 AI opponents, Easy/Normal/Hard economy + tactical AI, and reproducible map seed.
- Browser worker is authoritative *locally*; there are no network session tokens, server-hosted turns, matchmaking, PvP, or public server.
- Human player issues normal simulation commands for move/attack/stop, research, recruitment and construction.
- The client renders a fog-filtered 48x48 2D battlefield; optional WebGL 3D remains available. The model gallery stays accessible.
- Pause, single tick, 1/2/4x speed and local IndexedDB save/load are supported. Saves stay on the user's current browser/device.
- Nonvisible enemy units are omitted from display snapshots. The local browser necessarily owns the entire AI state; this is gameplay presentation visibility, not an anti-cheat boundary.

## Build and GitHub Pages

```sh
npm run build-pages
npm install --no-save playwright@1.56.1
npx playwright install --with-deps chromium
npm run pages-smoke
```

`scripts/build_pages.js` assembles `dist/pages/` with zero runtime servers:

1. Pre-exports 96 seven-bone humanoid and 120 multi-mesh vehicle glTF models.
2. Copies static same-origin OBJ/MTL, textures, units, faction data, browser-safe simulation modules and assets.
3. Rewrites asset fetch paths for the project Pages subpath, preserving original dev-server sources.
4. Generates a public skirmish `index.html` and `model-gallery/index.html`, each with a site-root `<base>` tag.

The browser smoke visits `/crowns-of-iron/` using real headless Chromium, launches 1v1 AI, tests pause + single-step + saving/loading with IndexedDB, tests 3D WebGL rendering and the model gallery. No simulation HTTP server is involved. It does **not** certify strategy/balance, GPU performance on all devices, full-length match victory or commercial release readiness.

The workflow `.github/workflows/pages.yml` builds and verifies on pull requests and milestone branches, but **only** uploads/deploys to GitHub Pages from `main` after smoke succeeds. GitHub Pages must be configured in repository Settings → Pages → Build and deployment → GitHub Actions. Site publishing may be blocked until the repo owner enables GitHub Pages and deployment privileges.

## Multiplayer preservation

The existing `src/network.js`, `src/loopbackProtocol.js`, `web/netplay.js`, developer localhost playtest scripts and previous Node CI workflows are **not deleted or modified for the new game**. They remain available for future network work. The default public entry page uses only the solo skirmish Worker.

## Caveats and follow-up

The current economy and tactical AI have early-game development heuristics rather than expert competitive play; complete victory-condition playtesting, content tuning, accessibility, small-screen controls and graphics quality are upcoming. GitHub Pages itself does not run compute or save your games on the server. IndexedDB saves can be lost if users clear browser storage.
