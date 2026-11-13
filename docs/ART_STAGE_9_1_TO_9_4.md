# Crowns of Iron — Art milestones 9.1–9.4

## Deliverable

This phase expands the previous six skinned Swordsman exemplars to **36 real glTF 2.0 character assets**, one for each of six humanoid roles in all six factions. The six roles are **Worker, Swordsman, Archer, Pikeman, Healer, Hero**. Each is exported from its own existing, editable role-specific OBJ geometry, with original faction color materials, seven joints, inverse bind matrices, two weighted influences at many vertices, and three idle/walk/attack quaternion animation tracks.

The remaining **180** unit archetypes retain the existing unique OBJ art, texture sampling and procedural animation fallback. No attempt is made to claim 216 exportable fully rigged characters, and siege/ship/aircraft should use their own animation systems rather than the humanoid rig.

## 9.1 — Expanded skinned asset family

- Added an explicit `web/skinnedRoster.js` allowlist of 36 faction/role identities.
- Updated `scripts/export_skinned_gltf.js` to generate these 36 real, self-contained `.gltf` files under `assets/gltf/<faction>/<role>.gltf`.
- `src/gltfAssets.js` generates and caches only requested faction+role assets; `src/loopbackProtocol.js` serves exact allowlisted glTF paths with strict MIME.
- The RTS renderer and `/model-gallery` load the appropriate faction and archetype on demand while retaining OBJ fallback.

## 9.2 — Improved skinning and transitions

The exporter now assigns blended skin weights to both the primary body-region joint and a secondary spine influence on many vertices. Runtime skeletal posing uses all four available joint slots (including zero-weight slots), checks weight normalization, interpolates quaternion animation tracks, and crossfades visual clip transitions for 160 milliseconds. Faction-specific joint pivots are retained, with bounded transient per-unit animation state.

**Limitations:** these are algorithmic skin weights, not hand-painted Blender weights or authored deformation fixes. CPU skinning is still in use; the glTF skin hierarchy is simple rather than a sophisticated production-grade skeleton. Animation transitions are cosmetic and never modify authoritative simulation.

## 9.3 — Higher-detail faction materials

`web/materialDetail.js` creates deterministic **128×128** faction surface textures from each faction's original 32×32 raster patterns. The new textures are embedded as PNG assets inside the exported glTF and are also sampled by the prototype's GPU UV fragment shader where supported. Worker and Healer have fabric-like roughness, Archer a more matte finish, and Hero/Pikeman more metallic PBR material metadata.

**Limitations:** surface content is procedurally enhanced from the original patterns, not original high-resolution hand-painted texture atlases. The game uses a textured diffuse shader rather than fully calculating metallic/roughness PBR lighting. The exported glTF does contain material properties for external glTF engines.

## 9.4 — Full export and regression checks

Run:

```sh
npm test
npm run validate
npm run syntax-check
npm run expanded-art-demo
npm run protocol-server
# Open http://127.0.0.1:5190/model-gallery
# Select one of the six skinned roles and a faction
```

The `expanded-art-demo` command writes all 36 physical `.gltf` files to `assets/gltf` and validates skin weights, rest pivots, animation changes, role material definitions and embedded textures. GitHub Actions uploads those 36 files as one downloadable artifact. A Node localhost smoke test checks generated glTF endpoints, unauthorized paths, and module imports; dedicated test coverage checks runtime clip blending and skinned mesh integrity. **These are not real Chrome/Firefox/Safari rendered-pixel tests, final asset art approval, or hardware GPU frame-rate guarantees.**

This draft PR builds on previous PR #22; `main` is unchanged.
