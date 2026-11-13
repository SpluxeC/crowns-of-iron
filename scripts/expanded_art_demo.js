import {readFile} from "node:fs/promises";
import {exportSkinnedRoster} from "./export_skinned_gltf.js";
import {SKINNED_ROLES,SKINNED_ASSET_COUNT,skinnedRoleSlug} from "../web/skinnedRoster.js";
import {FACTION_SLUGS} from "../web/factionArt.js";
import {validateSkinnedGltf,sampleSkinnedGltf} from "../web/skinnedGltf.js";
import {assert} from "../src/util.js";
const exported=await exportSkinnedRoster();
assert(exported.length===SKINNED_ASSET_COUNT);
let vertices=0,weighted=0,animated=0,totalBytes=0;
const profiles={};
for(const faction of FACTION_SLUGS)for(const role of SKINNED_ROLES){
 const slug=skinnedRoleSlug(role);
 const text=await readFile(new URL("../assets/gltf/"+faction+"/"+slug+".gltf",
  import.meta.url),"utf8");
 const raw=JSON.parse(text),model=validateSkinnedGltf(raw);
 assert(model.textureEmbedded&&model.pivots.length===7);
 assert(model.weights.some((value,index)=>index%4===1&&value>.05),
  "Missing blended joint weights: "+faction+"/"+role);
 const idle=sampleSkinnedGltf(model,"idle",0),
  attack=sampleSkinnedGltf(model,"attack",250);
 assert(idle.vertices.some((v,i)=>v!==attack.vertices[i]),
  "Missing attack animation: "+faction+"/"+role);
 const material=raw.materials[0].pbrMetallicRoughness;
 profiles[role]={metallicFactor:material.metallicFactor,
  roughnessFactor:material.roughnessFactor};
 vertices+=model.count;weighted++;animated++;totalBytes+=Buffer.byteLength(text);
}
assert(weighted===SKINNED_ASSET_COUNT&&animated===SKINNED_ASSET_COUNT);
assert(profiles.Hero.metallicFactor>profiles.Worker.metallicFactor);
console.log(JSON.stringify({phase:"9.1–9.4",
 factions:FACTION_SLUGS.length,skinnedArchetypes:SKINNED_ROLES,
 gltfExports:exported.length,sevenJointSkins:weighted,
 animatedPoses:animated,sourceMeshVertices:vertices,
 generatedPngResolution:"128x128",roleMaterialProfiles:profiles,
 totalExportBytes:totalBytes,
 scope:"36 skinned glTF models; the other 180 roster models use distinct OBJ fallbacks. No real browser visual/GPU FPS validation or full PBR renderer."},null,2));
