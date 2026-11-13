# Crowns of Iron — Art Stage 10.4: Articulated Vehicle Components

## Scope
Adds one **independently animated rigid mesh attachment** to each of the 120 specialized glTF 2.0 models (six factions × twenty land/siege, naval and air archetypes). This is **procedural first-pass geometry**, not segmentation or professionally rigged versions of original OBJ meshes.

- **Air:** crossed propeller blades plus hub, spinning on the local forward axis.
- **Naval:** deck-mounted turret with projecting barrel, traversing on the up axis.
- **Siege/land machinery:** a barrel assembly with pitch/recoil animation.

The original authored body is mesh/node 0. The new component is mesh/node 1, a child of node 0 with a fixed local anchor calculated from the body bounds. Each existing idle/walk/attack/hit/death animation now includes a third glTF channel for child rotation. Hit/death remain one-shot at 220 ms and 650 ms; the base body retains prior motion.

The browser decoder validates the exact two-node hierarchy and embedded buffers, reads both UV-textured triangle meshes, interpolates the child quaternion track and composes the child transform before the parent transform. Game-side selection, fog filtering, authoritative simulation and existing fallbacks remain unchanged.

## Verification
Automated tests cover glTF hierarchy structure, independent child motion, invalid node references, absence of skins, original hit/death behavior and all 120 vehicle combinations. Commands:

```sh
npm test
npm run syntax-check
npm run all-216-art-demo
npm run protocol-server
```

Open `http://127.0.0.1:5190/model-gallery` to inspect air, naval and siege vehicles in motion.

## Explicit limitations
- One supplementary procedural attachment per vehicle, not fully articulated existing weapons, propeller hubs, rudders, tracks and wheels.
- No authored damage meshes, explosion particle system, baked PBR material set, LOD chain, or hardware GPU performance certification.
- Changes remain on a stacked draft PR based on art stage 10.3 (PR #26), not on `main`.
