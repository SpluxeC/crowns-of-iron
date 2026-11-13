# Crowns of Iron — 3D OBJ model integration (milestones 7.5–7.8)

**Status:** ten original, editable Wavefront OBJ polygon models committed and wired to the browser's existing WebGL renderer. These are **first-pass stylized low-poly assets**, not high-fidelity finished art, a fully rigged/animated character set, nor distinct meshes for each of the 216 faction-unit catalog entries.

## Model catalog

| OBJ file | Current use |
| --- | --- |
| `worker.obj` | Worker with clothing, pack, tool |
| `infantry.obj` | Swordsmen and generic frontline soldiers; helmet, shield, weapon |
| `ranged.obj` | Archers and ranged infantry; hood, bow, back quiver |
| `hero.obj` | Hero and legendary land units; cloak, crown and banner |
| `siege.obj` | Battering ram and siege silhouettes; chassis, wheels and ram |
| `ship.obj` | Naval units; hull, mast, sail and deck |
| `air.obj` | Aircraft; body, wings and propeller geometry |
| `civilian.obj` | Farm and generic civilian buildings; roof, doors and windows |
| `defense.obj` | Wall and other defensive structures; battlements |
| `tower.obj` | Towers, forts and hangars; tall round tower and roof |

Every model is a real 3D triangle mesh with editable 3D coordinates and material IDs. Each OBJ references `crowns-palette.mtl`, with diffuse colors for armor, cloth, wood, stone, metals, etc. All files use **Y-up**, with grid coordinates X/Z, authored approximately in local world meters. They can be imported into Blender or other OBJ-compatible tools and customized.

## Game integration

- `web/assetManifest.js` holds stable asset IDs and fixed model file paths.
- `web/objLoader.js` strictly parses a safe subset of OBJ and MTL, validates indices/materials/counts, shades triangle faces, and converts model coordinates to packed WebGL vertices.
- `src/loopbackProtocol.js` serves exactly these eleven permitted local assets, and the authorized development client can access them without any third-party CDN.
- `web/webgl3d.js` loads them with `renderer.loadAssets()`. Until loaded or if loading fails, old proxy cubes render. Rendered units receive faction-relative cool/warm colors and selected units retain selection markers/health pips.
- The terrain mesh is rebuilt when building geometry is ready; thereafter the building mesh remains cached until visible terrain/structure content changes. Unit meshes are assembled each render; the detailed unit budget is capped at **160** visible mesh units per draw, with additional units shown via lightweight fallback cuboids.
- `/model-gallery` provides a local interactive model viewer: select a family, drag to orbit, and zoom. The playable local browser client links to it.

## Launch

From the branch, run:

```sh
npm install
npm run model-assets-demo
npm run browser-delivery-smoke
npm run protocol-server
```

Open `http://127.0.0.1:5190/model-gallery` for direct 3D inspection. Open `http://127.0.0.1:5190/client` and connect using the server's local development player token to see the models integrated into the match. The gallery itself needs no match token because it serves only public development static assets.

## Model editing

Import an OBJ into Blender along with the same-folder MTL file; use **Y-up** and export triangulated OBJ with local positions. Keep the file name, material names from `crowns-palette.mtl`, and the approximate extents. Run `npm test` and `npm run model-assets-demo` to validate the mesh before committing; the parser intentionally rejects unsupported OBJ features such as arbitrary commands, invalid indices, and unrecognized materials.

Replacing assets with arbitrary glTF/FBX geometry and skeletal animation is **not yet implemented**. Custom OBJ files must use `v`, `f`, and `usemtl` lines (plus harmless `o`, `g`, `s`, `mtllib` records). UV textures, joints, skinning and animation require a future import and render pipeline.

## Testing and limits

Node tests validate all ten model faces, materials, geometry bounds, transforms, GPU submission of genuine loaded meshes with a fake WebGL context, static geometry invalidation and fallback after fetch failure. A real localhost HTTP delivery smoke test verifies that all models and the gallery are served with correct paths and that model imports resolve.

**Unverified:** actual browser pixel output, hardware frame rates, visual quality across Safari/Chrome/Firefox, mobile GPU budgets, accessibility of 3D gallery on real devices, and artwork suitability for final release. The high-level family meshes are reused for multiple unit archetypes. Future work: individual faction identities, professional concept-to-mesh art, texture atlas, rigged animation and actual real-browser screenshot regression.

Draft PR stacks on the preceding milestone PR; `main` remains unchanged.
