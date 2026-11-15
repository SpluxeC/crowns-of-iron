# Milestone 12.7 — Fullscreen 3D Battlefield and Mobile Landscape HUD

The **primary single-player GitHub Pages game** now places the WebGL 3D battlefield edge-to-edge behind all gameplay UI. The former two-column page, centered canvas, scrolling sidebar and footer have been replaced by overlays.

## Layout and interaction

- The 3D canvas is fixed to the full viewport (width and height 100%) and independently resizes its WebGL drawing buffer for viewport, fullscreen, and orientation changes. Device pixel ratio is capped at 1.75 and texture dimensions are capped at 2048 for mobile GPU safety. Picking continues to use the actual drawing-buffer dimensions.
- Top bar overlays the map with Pause, Speed, Step, Empire, New, Save, Load, and Fullscreen actions.
- Unit commands and current selection float over the bottom of the battlefield.
- The empire panel opens as a **collapsible right-side drawer** for resources, training, technologies, buildings, enemy state and instructions. Closing it restores unobstructed battlefield space. Choosing construction closes the drawer automatically so placement can be completed on the map.
- Battle status overlays the top-left; the log is a translucent overlay on desktop and hidden on short landscape displays.
- UI respects safe-area insets for notches and home indicators. The single-player battle remains 3D only.

## Mobile landscape policy

- On phone-sized portrait viewports, a full-screen **Rotate your device** gate prevents any interaction with the game UI. Turning to landscape removes the gate.
- If an active match is running when portrait is entered, the simulation is paused; returning to landscape resumes a match that was paused by the orientation transition.
- The **Fullscreen** action requests browser fullscreen and attempts a landscape orientation lock where the browser permits it. Mobile Safari and other browsers may deny fullscreen or screen-orientation locking, so portrait blocking and manual physical rotation remain the universal fallback. Orientation cannot be forcibly changed by a normal website on every browser.
- Touch dragging still pans the camera, tapping units/buildings selects them, and overlay actions are usable in landscape.

## Verification

The existing GitHub Pages Chromium smoke exercises a real 3D AI skirmish and now checks the battlefield fills the browser viewport, the empire drawer opens/closes, the mobile portrait blocker is displayed, a landscape mobile match starts, mobile overlay controls remain accessible, touch input is accepted, and rotating back to portrait shows the blocker again.

Multiplayer development code remains intact and is not published as a player-versus-player backend.
