# Crowns of Iron — Art Batch 11.3–11.6

Stacked on art batch 10.10–11.2 (draft PR #31). This is a **procedural WebGL visual development batch**, not finished, hand-sculpted building models. `main` is unchanged.

## 11.3 — Faction architecture overlays

`web/buildingArchitecture.js` adds geometry on top of the existing generic or faction building OBJ meshes when a structure has a known owner from the filtered game snapshot. Each faction has an original stylistic motif and two complementary colors:

| Faction | Building silhouette accent |
| --- | --- |
| Humans | Rooftop pole and banner |
| Orcs | Paired aggressive roof fangs |
| Dwarfs | Three chunky roof battlements |
| Tree Elves | Canopy-like branch ornaments |
| Corrupt Elves | Tall paired roof spires |
| Ursa | Twin rooftop totems |

Four colored pilasters mark the building corners. Geometry is scaled to the existing structure footprint, with no changes to collision, footprint, construction, armor or ownership.

## 11.4 — Biome-specific ground atmosphere

`web/terrainAtmosphere.js` emits fixed, small low-poly terrain accents from tile coordinates for grassland, forest, hills, water and mineral deposits. Accents are deterministically placed, consume **at most 256 small static cubes per terrain-buffer rebuild**, and skip unsupported/unknown fog tiles altogether. There are no timers, emitters, drifting weather objects, reveal effects, or changes to terrain logic. Generated geometry uses the renderer's existing terrain signature cache and rebuilds only when map tiles/structures change.

## 11.5 — Gallery environment controls

The model gallery adds a Terrain selector for five biomes and can preview the architecture on its existing civilian, defensive and tower building families for each of six factions. This extends the existing mouse-orbit gallery; it is not a building-placement editor. Default is grassland and existing unit previews remain available.

## 11.6 — Deterministic and Chromium QA coverage

- `tests/architectureAtmosphere.test.js`: six unique faction trims, bounded per-building details, deterministic output, valid vertices, fog suppression, stable biome placement and the 256-piece limit.
- Browser screenshot smoke scenarios: **Dwarfs highland tower**, **Tree Elves forest house**, **Corrupt Elves defensive wall**, with existing WebGL context, image size, JS error and uniqueness checks.
- Node syntax verification covers the new modules. Package version updated to 11.6.0.
- Renderer diagnostics provide `architecturePieces` and `environmentPieces` counters.

## Check and preview

```sh
npm test
npm run syntax-check
npm run browser-art-smoke
npm run all-216-art-demo
npm run protocol-server
# Open http://127.0.0.1:5190/model-gallery
```

The existing full 216 unit glTF export still covers 96 humanoid and 120 specialized vehicles. The new buildings are **runtime accents**, not additional glTF exports or per-faction professionally authored building meshes.

## Outstanding work

No artistic terrain blending, realistic water simulation, wind, day/night lighting, hand-authored architecture asset pack, hardware GPU certification or pixel-baseline screenshot validation. The branch requires complete automated and real-browser QA before review/merge; stacked PR dependencies must be merged in order.
