# Milestone 12.6 — AoE-style RTS camera and 3D entity selection

The primary GitHub Pages skirmish is **3D only**. Camera and picking use the same projection as the WebGL renderer.

## Camera controls

- Default tactical view: 55° elevation/downward viewing pitch, north-facing yaw 0, narrow 52° vertical FOV for low distortion.
- Keyboard: **WASD** and **Arrow keys** move the focal point along the horizontal X/Z plane, rotated relative to camera heading. Input is normalized to prevent diagonals moving faster.
- Edge movement: moving cursor to the outer 26 CSS pixels of the battlefield pans in that direction. Cursor outside canvas stops edge pan.
- Zoom: mouse wheel smoothly interpolates radius from 17 to 88 map units, with close-up pitch flattening to 43° and tactical pitch approaching 55°.
- Rotation: **middle mouse drag** or **Alt + drag** rotates horizontally around the focal point. Releasing the rotation gesture or pressing **Backspace** eases yaw back to 0 (north). Left click alone does not rotate.
- Terrain: the camera uses bilinear height sampling and independent interpolation for height transitions; an eye-height clearance check prevents clipping through hills.
- Focus: X and Z clamp to the playable map (1 tile margin), including after zooming/rotating. On game start, focal point centers on the player's initial Scout.
- Touch: tap selects, swipe pans the camera.
- Camera update runs on requestAnimationFrame; WebGL scene redraw is capped at approximately 45 Hz when the camera moves.

## Entity interaction

- Visible units and structure roofs are projected to the screen and hit-tested against tap/click coordinates, including at closer zoom levels.
- Selection panel shows unit name/HP or structure kind and friendly/enemy ownership. Fogged entities cannot be selected.
- Movement, attack, worker selection, construction, recruitment, research, pauses, and IndexedDB saves remain available.

## Verification

`tests/rtsCamera.test.js` covers diagonal normalization, edge movement, map constraints, zoom and pitch, yaw snap-back, terrain sampling and clearance, and projected unit/building selection. The GitHub Pages Playwright smoke adds camera panning and wheel zoom checks while retaining complete skirmish/save/WebGL/gallery coverage.

The multiplayer development client remains unchanged. This is a renderer/control-layer change, not a simulation or balance rewrite.
