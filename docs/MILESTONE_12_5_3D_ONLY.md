# Milestone 12.5 — 3D-Only Skirmish Player View

GitHub Pages single-player AI skirmishes now use **only the WebGL 3D battlefield**. The old 2D Canvas scene, its drawing logic, click handler, 2D styling and "Switch to 2D / Switch to 3D" button have been removed from the public skirmish page.

## Behavior

- The 3D canvas is present and visible at page load. Model loading begins immediately; when a match starts, the 3D terrain and units draw without a manual view switch.
- The WebGL canvas continues to handle click-to-select, move targets, enemy attack targets, drag-to-orbit and wheel-to-zoom.
- Player controls including Worker/Military selection, training, research, building placement, pause/speed, save/load and AI matches remain unchanged.
- A WebGL initialization failure is surfaced in the battle log and status, rather than silently falling back to 2D.
- The existing multiplayer development client, its 2D fallback, and simulation/networking source remain preserved. This request changes only the **primary public single-player skirmish view**.

## Verification

The static Pages Chromium smoke now explicitly requires the visible 3D canvas, checks no 2D canvas or view-toggle exists, launches an AI skirmish, verifies Worker selection, runs pause/step/save/load, confirms 3D remains visible, and loads the 3D model gallery.

```sh
npm run build-pages
npm run pages-smoke
```

This change does not implement new 3D camera features or rebalance game systems. GitHub Pages deploys automatically from main only after the browser smoke passes.
