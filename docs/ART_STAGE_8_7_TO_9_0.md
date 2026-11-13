# Crowns of Iron — Art milestones 8.7–9.0

## Stage scope

This phase establishes an **actual glTF 2.0 skeletal asset pipeline** for **six representative Swordsman meshes**, one from each playable faction. It introduces an in-game browser glTF parser, seven-joint skinning, reusable quaternion animation clips, an embedded PNG PBR base-color texture in each glTF asset and a GPU diffuse texture shader for the skinned models.

The preceding **216 individual low-poly roster OBJ models remain intact**. They are **not** all converted to skinned glTF assets yet; the new pipeline provides a working and exportable exemplar per faction.

## 8.7 — glTF 2.0 exporter

`scripts/export_skinned_gltf.js` converts the authored UV-equipped OBJ Swordsman models to standard JSON `.gltf` files. Each output includes:

- Embedded base64 binary glTF buffer with POSITION, NORMAL, COLOR_0 and TEXCOORD_0 attributes
- Real JOINTS_0 and WEIGHTS_0 skin data per vertex
- A seven-joint hierarchy, per-joint rest translations and inverse bind matrices
- Three named idle/walk/attack glTF animation tracks, with rotation quaternion samples for six articulated joints
- Embedded **valid PNG** base-color material texture, sourced from the faction's original raster pattern
- Standard glTF PBR metallic/roughness material fields (metallic 0.12, roughness 0.82)

Run `npm run export-skinned-gltf` to create real files at `assets/gltf/<faction>/swordsman.gltf`. Generated files are ignored by Git for now; GitHub Actions includes the **six export files as a downloadable workflow artifact**. This avoids inflating the repository with duplicated base64 geometry and textures. The loopback server also offers the identical deterministic generated glTF at `/assets/gltf/<faction>/swordsman.gltf`.

## 8.8 — Runtime skinning

`web/skinnedGltf.js` validates the strict glTF layout, decodes embedded accessors, checks skin weights and seven bone pivots, interpolates authored quaternion rotation curves and CPU-skins model vertices. An authenticated match that sees Swordsman units can load the correct faction's glTF representation on demand. The WebGL battle view and `/model-gallery` render the skinned geometry using existing combat animation modes. If glTF is unavailable or invalid, the prior unique archetype OBJ mesh remains.

This is genuine glTF skeletal weight data, but the runtime currently performs joint skinning on the CPU. Hardware-accelerated GPU skinning for all 216 unit archetypes and animation blending across states are future work.

## 8.9 — GPU UV diffuse texture sampling

A separate `web/textureShader.js` WebGL shader takes genuine per-vertex UV coordinates and samples the faction's 32×32 texture **per fragment** using `texture2D`. GPU textures are cached once per faction and the shader is only used for the skinned glTF path. Existing terrain, structures and non-glTF units continue to use the old RGB vertex/color path. The embedded PNG/PBR material remains available for external glTF import; the game's shader does **not** yet reproduce physically-based metallic/roughness/normal lighting. The texture is the original low-resolution faction pattern, not final hand-painted material art.

## 9.0 — QA and reproducibility

Tests verify complete 7-joint glTF geometry, inverse bind matrix accessors, UV and skin weights, three animation clips, PNG generation, faction-specific loading, guarded fallback to OBJ, valid browser module paths, real loopback HTTP asset serving and simulated GPU texture upload/draw-cache behavior. A deterministic export demo regenerates, parses and animates all six physical `.gltf` files. CI publishes the complete six-file output.

```sh
npm test
npm run validate
npm run syntax-check
npm run gltf-art-demo
npm run protocol-server
# Open http://127.0.0.1:5190/model-gallery
# Choose a faction and Swordsman to inspect skinned glTF animation
```

**Remaining work:** 210 additional individual-role skinned models, hand-authored skin painting/weight blending, true GPU joint-matrix skinning, higher-resolution textures, full PBR renderer with normal/light maps, additional combat/death animation, automated screenshots in actual Chrome/Firefox/Safari, and manual GPU performance/playability verification. **Do not claim those are completed.**

This is a draft PR stacked on milestone 8.6; earlier PRs must be merged in order and `main` remains untouched.
