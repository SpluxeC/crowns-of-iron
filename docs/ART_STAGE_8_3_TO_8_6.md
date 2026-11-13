# Crowns of Iron — Art Development 8.3–8.6

This phase turns the six-faction **family** model library into **216 separate, archetype-specific original Wavefront OBJ meshes** for the complete reconciled launch roster: 6 playable factions × (22 land + 8 naval + 6 air unit archetypes). It also introduces standard OBJ UV coordinates and three artist-editable seven-joint animation curves.

These are stylized procedural low-poly game assets, not 216 hand-sculpted professional models. A completely finished production asset pipeline—rigged GLB/FBX export, GPU per-pixel PBR textures, skeletal vertex weights and browser pixel snapshots—remains a separate stage.

## 8.3 — 216 distinct unit meshes

Each of the six factions now has a file for **every** playable unit archetype:
- Land: Worker, Scout, Club Fighter, Stone Slinger, Stone Spearman, Swordsman, Archer, Pikeman, Raider, Heavy Infantry, Heavy Mobile, Battering Ram, Siege Tower, Healer, Converter, Hero, Gunner, Heavy Artillery, Anti-Air Infantry, Mechanized Infantry, Heavy War Machine and Legendary Land
- Naval: Raft, Fishing Vessel, Trade Ship, Transport Ship, Light Warship, Heavy Warship, Naval Siege Ship and Legendary Warship
- Air: Scout Aircraft, Interceptor, Gunship, Bomber, Air Transport and Aerial Battleship

They reuse the established faction body identity but incorporate distinct appended 3D geometry for the particular equipment: weapons, spears, shields, artillery barrels, ship cargo, siege structures, aircraft fins, gun pods and others. Each role also has a small unique crest/detail. All assets are located at `assets/models/roster/<faction>/<archetype>.obj`, with stable path identifiers in `web/rosterArt.js`.

## 8.4 — Game integration and selective loading

`web/rosterLoader.js` parses and caches only the needed distinct OBJ models in on-demand batches of up to twelve. The game reads player faction/archetype from the existing fog-filtered server snapshot and requests only visible unit types while the WebGL view is enabled. Roster models are preferred over the earlier faction family models. If a request fails, the former family/base/cuboid fallbacks remain. The existing detailed-unit budget (160 visible units per draw) still applies.

The local `/model-gallery` has a separate individual-unit selector containing all 36 unit archetypes. Select the faction first, choose an archetype, then orbit and zoom. The selected roster file loads on demand; this avoids blindly downloading 216 files.

## 8.5 — Standard Wavefront UVs and surface color sampling

Every new roster OBJ contains real **`vt` coordinates** and `f vertex/texture` indices, produced by a deterministic face-oriented planar unwrap (`web/objUv.js`). The OBJ parser validates, preserves and exposes those UVs, and the six original faction RGB PPM surface patterns are now sampled using those UVs rather than only the previous world-coordinate projection.

**Important:** The current shader still receives sampled RGB **vertex colors**. This is an **editable UV-authored mesh and CPU UV-texture bake**, not per-pixel GPU texture mapping, UV atlas painting, normal maps, metallic-roughness PBR or finished production textures. Existing family models without UVs continue to use fallback planar sampling.

## 8.6 — Reusable authored keyframes and validation

Three new reusable, editable keyframe clips—idle, walk, attack—live in `assets/animations/rig-clips.json`, with interpolation handled by `web/animationClips.js`. They provide angle tracks for the existing seven procedural body-region joints. The live game applies these clips to its mesh posing (without changing authoritative gameplay). The JSON format is portable and can guide later Blender/glTF authored animation, but **is not a real skinned glTF/FBX rig**.

New automated checks cover all 216 individual files, triangle validity, UV coordinates, cross-reference against 36 gameplay roles per faction, async caching and strict paths, real localhost HTTP model delivery, keyframe interpolation, and fake-WebGL rendering with changing posed vertex data.

## Commands

```sh
npm test
npm run validate
npm run syntax-check
npm run art-stage-demo
npm run protocol-server
# http://127.0.0.1:5190/model-gallery
```

Authoring/regeneration:

```sh
npm run generate-roster-art    # Regenerates 216 original OBJ files, including UVs
npm run export-animation-clips # Regenerates the JSON animation curve reference
```

These two commands overwrite generated files. Do not run them over a hand-edited Blender model without first preserving a copy.

**Limitations:** No live browser hardware/pixel QA, no per-vertex skinned armature, no native glTF 2.0 export, no final PBR texture maps, no weapon firing VFX and no bespoke hand-painted content. Keep PRs stacked; this draft branch is based on PR #20 without merging `main`.
