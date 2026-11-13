import test from "node:test";
import assert from "node:assert/strict";
import {gltfForFaction,gltfCacheStats} from "../src/gltfAssets.js";
import {validateSkinnedGltf} from "../web/skinnedGltf.js";
test("all six original faction glTF skins can be generated from the committed OBJ art",async()=>{
 for(const slug of ["humans","orcs","dwarfs","tree-elves","corrupt-elves","ursa"]){
  const first=await gltfForFaction(slug),again=await gltfForFaction(slug);
  assert.equal(first,again);
  const data=validateSkinnedGltf(JSON.parse(first));
  assert.equal(data.pivots.length,7);
  assert.equal(data.textureEmbedded,true);
 }
 assert.equal(gltfCacheStats().loaded,6);
 await assert.rejects(gltfForFaction("../other"),/Unknown/);
});
