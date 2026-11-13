# Art Stage 10.3 — Exported Vehicle Hit and Death Clips

This stage extends the 120 specialized (siege, naval, aerial) non-skinned glTF 2.0 meshes from three to **five mesh-node animation clips** each: `idle`, `walk`, `attack`, `hit`, `death`.

## Implementation

- The deterministic exporter adds non-looping 220 ms hit recoil and 650 ms falling/settling death transform animation tracks. These are stored as actual glTF animation samplers with translation and rotation channels.
- The browser parser now requires all five curves, retains the strict single embedded buffer and non-skinned mesh validation, and supports clamped one-shot clip sampling for hit/death while continuing to loop idle/walk/attack.
- The live RTS renderer uses the filtered snapshot's preexisting cosmetic event timing to select vehicle hit and death clips; the model gallery's preview actions use the new clips too.
- Existing health color flashes remain, but the death transform overlay is suppressed for animated vehicles to avoid a double rotation.
- The full 216-export validator checks all 120 vehicle outputs include hit/death and exhibit distinct sampled geometry.

## Limits

The 96 humanoids retain three skeletal clips and procedural combat overlays. The vehicle reactions are stylized whole-mesh procedural curves, **not** articulated turret/propeller rigging, production motion capture, damage VFX, or destructible assets. The authoritative gameplay, fog filtering, unit physics, hit points, collision, and combat are unchanged. The generated glTF outputs remain build artifacts rather than checked-in binaries.

## Verification commands

```sh
npm test
npm run syntax-check
npm run all-216-art-demo
```

Run the model gallery locally with `npm run protocol-server` and open `http://127.0.0.1:5190/model-gallery`. Verify hit and death in a specialized vehicle selection.

The GitHub draft PR for this stage is **stacked on PR #25**; do not merge before earlier art PRs.
