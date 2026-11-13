import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {parseMtl,parseObj} from "../web/objLoader.js";
import {parsePpm} from "../web/factionTextures.js";
import {rigForFaction} from "../web/rigProfiles.js";
import {ANIMATION_CLIPS} from "../web/animationClips.js";
import {exportSkinnedGltf} from "../scripts/export_skinned_gltf.js";
import {validateSkinnedGltf,sampleSkinnedGltf,createSkinnedGltfLoader} from "../web/skinnedGltf.js";
async function fixture(){
 const material=parseMtl(await readFile(new URL("../assets/models/crowns-palette.mtl",import.meta.url),"utf8"));
 const mesh=parseObj(await readFile(new URL("../assets/models/roster/orcs/swordsman.obj",import.meta.url),"utf8"),material);
 const png=parsePpm(await readFile(new URL("../assets/textures/factions/orcs.ppm",import.meta.url),"utf8"));
 return exportSkinnedGltf(mesh,rigForFaction("Orcs"),ANIMATION_CLIPS,png);
}
test("actual glTF 2 skin data parses and animates a different vertex pose",async()=>{
 const model=validateSkinnedGltf(await fixture());
 assert.equal(model.pivots.length,7);
 assert.ok(model.count>50);
 assert.equal(model.textureEmbedded,true);
 const idle=sampleSkinnedGltf(model,"idle",0);
 const attack=sampleSkinnedGltf(model,"attack",280);
 assert.equal(idle.vertices.length,model.count*6);
 assert.equal(idle.uvs.length,model.count*2);
 assert.notDeepEqual(Array.from(idle.vertices),Array.from(attack.vertices));
 assert.equal(attack.skinned,true);
});
test("skinned glTF validator rejects corrupt buffer or joints",async()=>{
 const doc=await fixture();
 doc.buffers[0].byteLength--;
 assert.throws(()=>validateSkinnedGltf(doc),/size mismatch/);
 const loader=createSkinnedGltfLoader(async()=>({ok:false}));
 await assert.rejects(loader.load("Orcs"),/unavailable/);
 await assert.rejects(loader.load("../unknown"),/Invalid/);
});
