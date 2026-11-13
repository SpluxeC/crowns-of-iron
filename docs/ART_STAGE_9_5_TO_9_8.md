# Crowns of Iron — Art milestones 9.5–9.8

## Scope

This batch expands skinned animation support from the previous **36 models** to **96 individual land-unit glTF 2.0 models**: sixteen humanoid roles across Humans, Orcs, Dwarfs, Tree Elves, Corrupt Elves and Ursa. The 96 models are generated from the distinct roster OBJ meshes, with seven-joint weighted skins, idle/walk/attack quaternion clips and embedded 128×128 material PNGs.

The sixteen roles are Worker, Swordsman, Archer, Pikeman, Healer, Hero, Scout, Club Fighter, Stone Slinger, Stone Spearman, Raider, Heavy Infantry, Converter, Gunner, Anti-Air Infantry and Mechanized Infantry. The remaining 120 faction-unit combinations retain the separate UV-mapped OBJ models. **The 96 are algorithmically rigged, stylized low-poly models, not 96 hand-animated professional characters.**

## 9.5 — Expanded land glTF coverage

`web/skinnedRoster.js` now has a compatible original six-role `SKINNED_ROLES` list and a superset `ALL_SKINNED_ROLES`. The game and model gallery load the superset on demand; `/assets/gltf/<faction>/<role>.gltf` serves only the allowlisted combinations. Earlier Swordsman and six-role demos retain their original scope and continue to work.

`npm run expanded-land-art-demo` creates and validates the **96 physically exportable glTF files** in `assets/gltf`, including real mesh positions, normals, UVs, material definitions, inverse bind matrices, joint weights and all three animation clips. GitHub Actions uploads the finished files as the `crowns-of-iron-96-land-gltf-skins` artifact.

## 9.6 — Specialized vehicle animation

The original OBJ roster's naval, air and siege classes now use domain-specific client visual motion via `web/vehicleMotion.js`: ships gently bob and roll; aircraft bank, pitch and hover; siege engines recoil during attack. These transforms are applied only to the local rendering vertex assembly, never to server simulation positions, line-of-sight or combat results. Humanoid rigs are not applied to ships or aircraft. For a siege unit to receive dedicated firing/turret articulation beyond chassis movement, future authored rigs would be needed.

## 9.7 — Real-browser WebGL smoke

A dedicated Chromium screenshot test (`scripts/browser_art_smoke.js`) launches the local HTTP protocol server, loads the **real browser** model gallery using headless Chromium/SwiftShader and verifies a WebGL context. The test loads different faction-specific models, verifies the gallery reports loaded skinned glTF and OBJ fallback variants, captures three screenshots and visits the main client. It fails on browser JS exceptions or HTTP server errors, and reports screenshot hashes. The resulting PNG images are uploaded under `crowns-of-iron-chromium-visual-art-qa`.

This is **real Chromium browser execution**, unlike earlier fake-GL unit tests, but the screenshots are **not yet compared against approved pixel baselines**, and SwiftShader is a software GPU. No native Windows graphics driver, console, iOS Safari or device frame-rate results are claimed.

## 9.8 — Regression and packaging

All previous economic, gameplay, server authorization, art model parsing, collision, and simulation tests remain in the same GitHub Actions pipeline. A new export test checks all 96 skins and pose changes. Separate motion tests cover naval, aircraft and siege deformation. The workflow preserves earlier six-model and 36-model legacy export artifacts and adds a 96-model bundle plus browser screenshots.

### Commands

```sh
npm test
npm run validate
npm run syntax-check
npm run expanded-land-art-demo
npm run protocol-server
# http://127.0.0.1:5190/model-gallery
```

For browser graphics verification on a machine with Node 22:

```sh
npm install --no-save playwright@1.56.1
npx playwright install --with-deps chromium
npm run browser-art-smoke
```

Screenshots go into `artifacts/browser-qa/`. Generated glTFs and screenshots are CI artifacts; the original OBJ meshes, algorithms and scripts are source-controlled.

## Outstanding production work

- Truly distinct skinned rigs and authored animations for large siege/mounted units, all ships and aircraft
- Author-painted texture atlases, weathering, normal maps, proper glTF material handling and full PBR renderer
- Real GPU hardware and mobile browser FPS benchmarking, screenshot comparison against reviewed baselines
- Gameplay-complete attack/death/hit/reload/build/harvest animation clips and associated effects
- Professional art review, silhouette readability across all 216 units, optimized LODs and draw calls

This draft branch remains stacked on PR #23, with no merge into `main`.
