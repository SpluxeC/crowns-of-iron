import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {ALL_SKINNED_ROLES,EXTENDED_SKINNED_ROLES,TOTAL_SKINNED_ASSET_COUNT,
 skinnedGltfPath} from "../web/skinnedRoster.js";
import {ROSTER_ROLES,LAND_ROLES} from "../web/rosterArt.js";
import {FACTION_SLUGS} from "../web/factionArt.js";
import {gltfForFaction} from "../src/gltfAssets.js";
import {validateSkinnedGltf,sampleSkinnedGltf} from "../web/skinnedGltf.js";
import {vehicleMotion} from "../web/vehicleMotion.js";
test("new 96-model skin registry avoids vehicles and supports all listed infantry classes",()=>{
 assert.equal(ALL_SKINNED_ROLES.length,16);
 assert.equal(EXTENDED_SKINNED_ROLES.length,10);
 assert.equal(TOTAL_SKINNED_ASSET_COUNT,96);
 assert.equal(new Set(ALL_SKINNED_ROLES).size,16);
 for(const role of ALL_SKINNED_ROLES){
  assert.ok(LAND_ROLES.includes(role));
  for(const faction of FACTION_SLUGS)assert.match(skinnedGltfPath(faction,role),/\.gltf$/);
 }
 for(const role of ROSTER_ROLES.filter(r=>!LAND_ROLES.includes(r))){
  assert.equal(skinnedGltfPath("Humans",role),null);
  assert.ok(vehicleMotion(role,"walk",250));
 }
});
test("six factions each export newly supported playable role glTF with functional skin",async()=>{
 for(const faction of FACTION_SLUGS)for(const role of EXTENDED_SKINNED_ROLES){
  const model=validateSkinnedGltf(JSON.parse(await gltfForFaction(faction,role)));
  assert.equal(model.pivots.length,7);
  assert.equal(model.textureEmbedded,true);
  assert.ok(model.weights.some((v,i)=>i%4===1&&v>.01));
  const idle=sampleSkinnedGltf(model,"idle",0),attack=sampleSkinnedGltf(model,"attack",225);
  assert.ok(idle.vertices.some((v,i)=>v!==attack.vertices[i]));
 }
});
