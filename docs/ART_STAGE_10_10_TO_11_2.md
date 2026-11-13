# Crowns of Iron — Combined Art Stages 10.10–11.2

This branch is **stacked on draft PR #30** (stages 10.7–10.9). `main` remains unchanged.

## 10.10 — Domain-aware damage materials

- `web/damageFinish.js` introduces distinct procedural damage profiles for humanoid, land/siege, naval, and air identities, and six faction accent colors.
- Damage produces deterministic mesh vertex-color darkening and selectively exposed-edge accents as HP falls. This affects both the simple colored draw and the existing per-vertex RGB multiplied UV shader; no original glTF/OBJ vertex positions, base texture files, UVs, HP or game mechanics are changed.
- Inputs are checked for finite HP/maximum HP, canonical factions, known domains and nonnegative integer seeds.
- It is *stylized vertex-color wear*, not a new roughness/normal-map/physically based rendering or decals system.

## 11.0 — Faction-identified combat cues

- `web/factionCombatVfx.js` assigns original faction-specific RGB colors to the existing attack, hit, and death burst geometry.
- The effect is selected from **already-visible entities in the server-filtered snapshot**; no hidden entities are reintroduced.
- Sea, air, siege and humanoid effects use domain-appropriate approximate local offsets. An attack flash indicates the current attack animation only; it does **not** claim authoritative projectile timing or impact location.
- Generic gallery previews without a selected faction retain the original neutral palette.

## 11.1 — Explicit cosmetic workload caps

- `web/artFrameBudget.js` enforces per-draw caps of **72 HP wear passes** and **64 combat bursts** (24 vertices each, at most 1,536 transient burst vertices). The detailed-geometry budget of 160 units is preserved.
- The renderer exposes `artBudget` counters and limits in diagnostics; caps are deterministic and discard only extra cosmetic passes, never actual entities, gameplay state, fog visibility, or movement.
- These are CPU/submission safeguards, **not adaptive LOD, measured GPU speedups, or hardware FPS claims**.

## 11.2 — Faction and damage browser QA

- `tests/artStage11.test.js` covers all six faction material outputs in four damage domains, unchanged positions and UVs, reproducibility, safe error cases, effect colors, bounded 24-vertex octahedra, and budget exhaustion.
- The Chromium/SwiftShader art smoke adds screenshots for Tree Elves and Corrupt Elves Heavy Warship at 30 HP during hit reactions and Dwarfs Heavy Artillery at 5 HP during its death pose.
- Images are QA artifacts with basic screenshot and JavaScript-error checks, not pixel-exact baseline golden-image comparisons.
- Package version advances to 11.2.0 and new module syntax checks are registered.

## Verification / merge gate

```sh
npm test
npm run syntax-check
npm run all-216-art-demo
npm run browser-art-smoke
```

The 216 original stylized glTF roster units (96 humanoid skins + 120 specialized vehicles) remain the exporter coverage target. Damage and flash effects apply **at rendering time**, rather than being separately authored across all models.

**Do not merge** until full CI, export validation, Chromium screenshot smoke and review pass in dependency order. These are first-pass procedural cosmetic improvements, not release-ready artist-grade effects, complete PBR or GPU-certified game assets.
