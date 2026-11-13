import {readFile} from "node:fs/promises";
import {FACTION_SLUGS} from "../web/factionArt.js";
import {ALL_SKINNED_ROLES,skinnedRoleSlug} from "../web/skinnedRoster.js";
import {VEHICLE_ROLES,VEHICLE_GLTF_COUNT} from "../web/vehicleArt.js";
import {ROLE_SLUGS} from "../web/rosterArt.js";
import {exportSkinnedRoster} from "./export_skinned_gltf.js";
import {exportAllVehicles} from "./export_vehicle_gltf.js";
import {validateSkinnedGltf,sampleSkinnedGltf} from "../web/skinnedGltf.js";
import {parseVehicleGltf,sampleVehicleGltf} from "../web/vehicleGltf.js";
import {assert} from "../src/util.js";
const people=await exportSkinnedRoster(ALL_SKINNED_ROLES),
 machines=await exportAllVehicles();
assert(people.length===96&&machines.length===VEHICLE_GLTF_COUNT);
let animated=0,bytes=0,vertices=0;
for(const faction of FACTION_SLUGS){
 for(const role of ALL_SKINNED_ROLES){
  const source=await readFile(new URL("../assets/gltf/"+faction+"/"+
   skinnedRoleSlug(role)+".gltf",import.meta.url),"utf8");
  const model=validateSkinnedGltf(JSON.parse(source));
  assert(model.textureEmbedded);
  const idle=sampleSkinnedGltf(model,"idle",0);
  const attack=sampleSkinnedGltf(model,"attack",245);
  assert(idle.vertices.some((v,i)=>v!==attack.vertices[i]));
  vertices+=model.count;bytes+=Buffer.byteLength(source);animated++;
 }
 for(const role of VEHICLE_ROLES){
  const source=await readFile(new URL("../assets/gltf-vehicles/"+faction+"/"+
   ROLE_SLUGS[role]+".gltf",import.meta.url),"utf8");
  const model=parseVehicleGltf(JSON.parse(source));
  assert(model.embeddedPng&&model.count>50);
  for(const mode of ["hit","death"])assert.ok(model.animations[mode]);
  const still=sampleVehicleGltf(model,"idle",0),moving=sampleVehicleGltf(model,"attack",245);
  assert(still.vertices.some((v,i)=>v!==moving.vertices[i]),
   "Vehicle animation absent "+faction+"/"+role);
  const hit=sampleVehicleGltf(model,"hit",110),death=sampleVehicleGltf(model,"death",650);
  assert(still.vertices.some((v,i)=>v!==hit.vertices[i]));
  assert(still.vertices.some((v,i)=>v!==death.vertices[i]));
  bytes+=Buffer.byteLength(source);vertices+=model.count;animated++;
 }
}
assert(animated===216);
console.log(JSON.stringify({milestones:"9.9–10.3",
 exportedGltfModels:animated,humanoidSkinned:96,specializedVehicles:120,
 sourceVertexCount:vertices,totalJsonBytes:bytes,
 animationFamilies:["humanoid bones","animated non-skinned vehicle mesh nodes"],
 notes:"Stylized procedural mesh art and first-pass clip curves. GPU shader is diffuse; no hardware GPU certification, artist PBR or hand-keyed death."},null,2));
