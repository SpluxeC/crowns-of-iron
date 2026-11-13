import {readFile} from "node:fs/promises";
import {exportSkinnedRoster} from "./export_skinned_gltf.js";
import {ALL_SKINNED_ROLES,TOTAL_SKINNED_ASSET_COUNT,skinnedRoleSlug} from "../web/skinnedRoster.js";
import {FACTION_SLUGS} from "../web/factionArt.js";
import {validateSkinnedGltf,sampleSkinnedGltf} from "../web/skinnedGltf.js";
import {assert} from "../src/util.js";
const exports=await exportSkinnedRoster(ALL_SKINNED_ROLES);
assert(exports.length===TOTAL_SKINNED_ASSET_COUNT);
let tested=0,vertices=0,blendVertices=0,bytes=0;
for(const faction of FACTION_SLUGS)for(const role of ALL_SKINNED_ROLES){
 const source=await readFile(new URL("../assets/gltf/"+faction+"/"+skinnedRoleSlug(role)+".gltf",
  import.meta.url),"utf8");
 const model=validateSkinnedGltf(JSON.parse(source));
 assert(model.pivots.length===7&&model.textureEmbedded);
 const blended=model.weights.filter((v,i)=>i%4===1&&v>.01).length;
 assert(blended>5,"Missing multiple skin influences "+faction+"/"+role);
 const idle=sampleSkinnedGltf(model,"idle",0);
 const attacking=sampleSkinnedGltf(model,"attack",255);
 assert(idle.vertices.some((v,i)=>v!==attacking.vertices[i]),
  "Missing animated geometry "+faction+"/"+role);
 const between=sampleSkinnedGltf(model,"attack",255,
  {transitionFrom:"idle",transitionAlpha:.5});
 assert(between.vertices.some((v,i)=>v!==attacking.vertices[i]));
 tested++;vertices+=model.count;blendVertices+=blended;
 bytes+=Buffer.byteLength(source);
}
console.log(JSON.stringify({milestones:"9.5–9.8",
 skinnedRoles:ALL_SKINNED_ROLES.length,factions:FACTION_SLUGS.length,
 gltfSkins:tested,vertices,blendVertices,bytes,
 remainingUniqueObj:216-tested,
 visualBrowserQA:"Separate Playwright/Chromium screenshot job; not in this exporter"},null,2));
