import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {parseObj,parseMtl} from "../web/objLoader.js";
import {parsePpm} from "../web/factionTextures.js";
import {rigForFaction} from "../web/rigProfiles.js";
import {ANIMATION_CLIPS} from "../web/animationClips.js";
import {exportSkinnedGltf,ppmToPng} from "../scripts/export_skinned_gltf.js";
test("valid glTF skin exporter emits seven joints, embedded PNG PBR and animated quaternion tracks",async()=>{
 const materials=parseMtl(await readFile(new URL("../assets/models/crowns-palette.mtl",import.meta.url),"utf8"));
 const mesh=parseObj(await readFile(new URL("../assets/models/roster/humans/swordsman.obj",import.meta.url),"utf8"),materials);
 const image=parsePpm(await readFile(new URL("../assets/textures/factions/humans.ppm",import.meta.url),"utf8"));
 assert.deepEqual([...ppmToPng(image).subarray(0,8)],[137,80,78,71,13,10,26,10]);
 const doc=exportSkinnedGltf(mesh,rigForFaction("Humans"),ANIMATION_CLIPS,image);
 assert.equal(doc.asset.version,"2.0");
 assert.equal(doc.skins[0].joints.length,7);
 assert.equal(doc.animations.length,3);
 assert.equal(doc.animations[0].channels.length,6);
 const attributes=doc.meshes[0].primitives[0].attributes;
 for(const name of ["POSITION","NORMAL","TEXCOORD_0","COLOR_0","JOINTS_0","WEIGHTS_0"])
  assert.ok(Number.isInteger(attributes[name]));
 assert.equal(doc.accessors[attributes.POSITION].count,mesh.vertexCount);
 assert.match(doc.images[0].uri,/^data:image\/png;base64,/);
 assert.equal(doc.materials[0].pbrMetallicRoughness.roughnessFactor,.82);
 assert.equal(doc.nodes[0].skin,0);
 assert.ok(doc.buffers[0].byteLength>1000);
});
