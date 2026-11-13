# Crowns of Iron — Faction Art Stage (Milestones 7.9–8.2)

This stage provides **60 newly generated, physically separate Wavefront OBJ triangle meshes** (six factions × ten role/building families), **six original 32×32 RGB surface-pattern textures**, a revised material library, and **six procedural body-region rig profiles with three animated clips**. These are integrated into the local WebGL RTS client and the model gallery.

The work is intentionally an **original low-poly first-pass art system**, not 216 unique roster units, high-fidelity production models, UV/PBR texturing or Blender-ready skeletal animation.

## Faction art identity

| Faction | Silhouette signature | Palette direction |
|---|---|---|
| Humans | Plumes, straight banners, weapon fittings | Steel-blue, silver and gold |
| Orcs | Horns, broad torsos, jagged spikes | Rust red, dark iron and green skin |
| Dwarfs | Squat proportions, broad plated shoulders | Bronze, stone and teal |
| Tree Elves | Lean outlines, branching protrusions, leaf motifs | Forest green and luminous foliage |
| Corrupt Elves | Tall angled horns and crystal spikes | Violet, black metal and magenta |
| Ursa | Wide proportions, rounded ears, prominent snouts | Brown, bone and fur-like ochre |

Ten original mesh families per faction: `worker`, `infantry`, `ranged`, `hero`, `siege`, `ship`, `air`, `civilian`, `defense`, `tower`. Every file adds unique polygon geometry, scales/proportions and material references, rather than merely displaying a differently colored copy of a common object.

Files: `assets/models/factions/<faction>/<family>.obj`. Both the generated OBJ geometry and the shared `assets/models/crowns-palette.mtl` are editable with an OBJ-compatible DCC such as Blender. A reproducible source generator resides at `scripts/generate_faction_art.js`.

## Material and texture treatment

Six original `P3` RGB PPM pattern maps live under `assets/textures/factions/<faction>.ppm`, regenerated with `scripts/generate_faction_textures.js`. The validated `web/factionTextures.js` loader applies repeatable **planar, CPU-sampled pattern modulation to the loaded OBJ mesh's vertex colors**. The shared MTL palette provides four new material variations per faction (primary, armor, skin, trim).

**Limitations:** these are real texture files that influence rendered mesh color, but the current renderer does **not** have artist-authored UV layouts, per-pixel GPU texture sampling, normal maps, physically-based roughness/metallic materials, or high-resolution texture atlases. Their appearance is intentionally pixelated and tied to low-poly vertex density.

## Procedural animation and rigging

A per-faction seven-joint body-region rig description is provided in `assets/rigs/faction-rigs.json`. The current code in `web/rigProfiles.js` and `web/meshAnimation.js` calculates faction-specific approximate shoulder/hip pivots and rotates corresponding mesh vertex regions while playing `idle`, `walk`, and `attack` pose clips. The browser draws at most eight visual updates per second while the 3D view is visible. Authoritative gameplay positions and combat decisions remain server-controlled; animated offsets are client-side visual only.

The rig metadata describes **runtime procedural pivot animation**, not an exported skeletal armature; there are no imported skin weights, bind matrices, inverse bind poses, native Blender bones or FBX/glTF animation clips. These are still required for professional character animation.

## In-game and gallery use

The authenticated game snapshot supplies each player's faction. `web/factionArt.js` resolves the correct OBJ file by faction and model role; `web/webgl3d.js` loads the 60 variants after the ten generic base models. Structures use the owning player's faction; fog-of-war data is still filtered server-side. Loading failures fall back to generic shapes. High unit counts retain the previous **160 detailed mesh units per render** cap.

The local gallery at `http://127.0.0.1:5190/model-gallery` now lets you select among generic and all six faction variants, each of the ten roles, and idle/walk/attack clip previews. It rotates/zooms in WebGL and displays triangle counts.

```sh
npm run protocol-server
# Open http://127.0.0.1:5190/model-gallery
# Live match client: http://127.0.0.1:5190/client

npm test
npm run faction-art-demo
npm run syntax-check
```

To regenerate authored procedural sources:

```sh
npm run generate-faction-art
npm run generate-faction-textures
npm run generate-faction-rigs
```

After manual Blender edits, avoid blindly regenerating unless intentionally replacing customized OBJ geometry.

## Automated validation

- 60 OBJ assets checked against materials, triangle counts, geometry bounds, and faction-specific shape changes
- Six raster texture maps checked for unique valid pixels, deterministic sampling and rejection of malformed data
- Six rig profiles and their seven joint labels validated against the committed JSON skeleton metadata
- OBJ GPU buffer submission, visual pose changes, texture-mapped vertex coloring, base model fallback
- Real loopback HTTP delivery for every asset path, viewer page, script import, rig metadata and authorization controls
- Existing headless gameplay, economy, local network and movement regression tests

**Not validated:** manually rendered browser pixels, hardware GPU FPS, WebGL on iOS/mobile devices, professional art quality, 216 separate faction-unit variants, motion-capture animation, full Blender skeletons, secure public multiplayer, or real multiplayer latency. Avoid treating the completed art stage as a production release.

Draft PR remains stacked on PR #19, with no changes to `main`.
