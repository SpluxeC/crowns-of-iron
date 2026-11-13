# Crowns of Iron — Art Stage 9.9–10.2

This stage completes a **first-pass exportable glTF 2.0 asset for every one of the 216 faction/archetype combinations**, with two different animation architectures appropriate to their geometry.

## 9.9 — 120 specialized non-humanoid animated glTF models

The earlier stage produced **96 skinned humanoid glTF models**, all with real seven-joint skin weights and inverse bind matrices. This stage adds **120 non-skinned glTF models** representing the other **20 archetypes × six factions**. Their geometry remains based on the unique faction-specific UV-mapped roster OBJ files. Large land/siege units, ships, and aircraft use mesh-node transform animations, **not humanoid skeletons**.

Each of these 120 glTF 2.0 files contains a triangle mesh with position, normal, UV, vertex color data; an embedded 128×128 PNG with standard metallic-roughness material metadata; and three independently authored **idle, walk, attack** root-node position/rotation animation tracks. Sea units rock/bob, aircraft pitch/bank/hover, and siege platforms move/recoil. The first-pass vehicle rig is limited to **whole-object transforms**: articulating gun barrels, propellers, rudders, turrets, sails and wheels need their own future multi-node animations.

Run `npm run export-vehicle-gltf` to write `assets/gltf-vehicles/<faction>/<role>.gltf`. Generated files are ignored by Git; the source OBJ assets and the exporter are committed.

## 10.0 — Browser animation, textures and game integration

`web/vehicleGltf.js` loads a strict, same-origin, embedded-buffer glTF format, validates mesh/UV coordinates and animated transform tracks, evaluates quaternion rotation and movement curves, and assembles real animated vertices. The game loads individual vehicle glTF models on demand from exact allowlisted HTTP paths `/assets/gltf-vehicles/<faction>/<role>.gltf`. The UV shader continues GPU per-fragment texture sampling and caching; if the glTF cannot be loaded, the unique OBJ roster model remains. The 160 detailed-unit budget is unchanged.

All 216 faction/archetype combinations therefore have an **exportable glTF representation**, but only 96 are skinned. The other 120 are animated at mesh-node level; the original OBJ versions are retained.

## 10.1 — Hit and death art effects

The browser now provides a transient damage-color flash and 650 ms death pose for **explicitly visible units that are still present in the server-fog-filtered snapshot**. No death echo is generated when a unit disappears from visibility or from the snapshot, and no hidden enemy is revealed. Effects are client visual state only and cannot influence simulation, weapons, downed rules or player health. The gallery provides **Hit reaction** and **Death transition** preview modes. These are procedural overlays, **not additional glTF skeletal attack/death clips**; they need hand-keyed art in a later stage.

## 10.2 — Asset packaging, HTTP and real Chromium tests

`npm run all-216-art-demo` generates and validates **216 physical `.gltf` files**: 96 skinned humanoids, 120 animated specialized models. It verifies the embedded PNG textures, clips, readable geometry, and non-identical idle/attack poses for each asset. The CI workflow uploads the `crowns-of-iron-all-216-animated-gltf` archive with the output.

The localhost HTTP smoke validates authorized client delivery, the 25 static browser modules, selected humanoid and vehicle glTF files, strict rejection of unknown URLs, and the prior gameplay/network protocol rules. The **real Playwright Chromium/SwiftShader** job loads the 3D gallery and takes screenshots of humanoid, aircraft, warship, artillery variants and the game client. Screenshot uniqueness is checked, and browser JavaScript errors/HTTP 5xx responses fail the job.

```sh
npm test
npm run validate
npm run syntax-check
npm run all-216-art-demo
npm run protocol-server
# http://127.0.0.1:5190/model-gallery
```

For local browser screenshots install `playwright@1.56.1` and Chromium as described in the earlier stage, then run `npm run browser-art-smoke`.

### Remaining limitations

Original procedural low-poly geometry is **not hand-finished production art**. The GPU renderer uses diffuse UV sampling, not a full physically based lighting model. Real hardware GPU/console/iOS testing, pixel-approved screenshot baselines, proper mesh LODs, skeletal equipment bones, multi-node vehicle articulation, dead unit art assets and full combat/death/harvest/reload/build animation libraries remain. Software Chromium smoke alone does not provide hardware performance guarantees.

This draft PR is stacked on PR #24, and `main` is untouched.
