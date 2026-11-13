# Crowns of Iron — Combined Art Milestones 10.7–10.9

## 10.7 — HP-driven surface battle wear

- Added `web/battleWear.js`: deterministic triangle-level darkening and warm exposed-edge tint based on unit HP, with bounded inputs and no frame-dependent random flicker.
- Applied to available skinned glTF, vehicle glTF, and OBJ/proxy mesh data before transient hit/death coloring in the WebGL renderer; original base glTF and OBJ files are unchanged.
- Purely cosmetic. The server still owns unit HP and death events.
- The gallery offers Pristine / Light / Heavy / Critical damage selection for inspection.

## 10.8 — Low-poly weapon and impact effects

- Added `web/combatVfx.js`: GPU-friendly untextured 24-vertex octahedral bursts for the opening 115 ms of an attack animation, existing 220 ms hit reactions and existing 650 ms death visuals.
- The attack flash is an **animation-synced cue** rather than proof of a server projectile/impact. No additional combat damage, projectile system, weapon range changes or sound events.
- No timers, growing particle lists or persistent trails. Cap: 160 emitted bursts per draw, from **only currently fog-filtered, visible unit snapshots**. Disappearing units cannot emit hidden flashes.
- Existing hit/death overlays remain intact.

## 10.9 — Art QA & gallery preview

- New `tests/combatArtPolish.test.js` validates deterministic and bounded paint, unchanged geometry, 24-vertex VFX topology, and filtered-snapshot behavior.
- Browser gallery adds the independent HP preview selector; `scripts/browser_art_smoke.js` now captures the Orc Bomber at 30/100 HP during attack animation.
- Syntax checks include both new modules.
- `npm run all-216-art-demo` remains the existing full roster export validator (96 skeletal humanoids + 120 specialized vehicles). The visual effects are **runtime overlays**, not 216 newly baked or hand-authored mesh exports.

## Commands

```sh
npm test
npm run syntax-check
npm run all-216-art-demo
npm run browser-art-smoke
npm run protocol-server
```

Inspect `http://127.0.0.1:5190/model-gallery`, choose a faction-specific specialized vehicle and try Attack, Hit, Death and Heavy damage.

## Release limitations / review requirements

This is prototype art, not production particles, licensed effects, destructible geometry, bespoke damage decals, shader-based roughness, baked PBR, hardware FPS certification, or actual authoritative firing timing. Screenshot smoke checks for successful rendering and unique output hashes, **not pixel-perfect image baselines**. Full CI, browser and export QA must pass before merging.

This branch stacks on draft PR #29 (stage 10.6). `main` remains unchanged.
