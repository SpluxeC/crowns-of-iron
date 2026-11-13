import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {parseObj,parseMtl} from "../web/objLoader.js";
import {parsePpm} from "../web/factionTextures.js";
import {refineFactionTexture} from "../web/materialDetail.js";
import {exportVehicleGltf} from "../scripts/export_vehicle_gltf.js";
import {parseVehicleGltf,sampleVehicleGltf,createVehicleGltfLoader} from "../web/vehicleGltf.js";
async function source(role="Bomber"){
 const materials=parseMtl(await readFile(new URL("../assets/models/crowns-palette.mtl",import.meta.url),"utf8"));
 const slug=role.toLowerCase().replace(/[^a-z0-9]+/g,"-");
 const mesh=parseObj(await readFile(new URL("../assets/models/roster/ursa/"+slug+".obj",import.meta.url),"utf8"),materials);
 const image=refineFactionTexture(parsePpm(await readFile(
  new URL("../assets/textures/factions/ursa.ppm",import.meta.url),"utf8")),"ursa");
 return exportVehicleGltf(mesh,image,{role,faction:"ursa"});
}
test("real glTF 2.0 animated non-humanoid mesh validates and changes during attack",async()=>{
 for(const role of ["Bomber","Legendary Warship","Heavy Artillery"]){
  const mesh=parseVehicleGltf(await source(role));
  assert.ok(mesh.count>50);
  assert.equal(mesh.embeddedPng,true);
  assert.ok(mesh.componentCount>=36);
  assert.ok(mesh.baseCount>50);
  assert.equal(mesh.count,mesh.baseCount+mesh.componentCount);
  for(const mode of ["hit","death"])assert.ok(mesh.animations[mode]);
  const initial=sampleVehicleGltf(mesh,"idle",0);
  const attack=sampleVehicleGltf(mesh,"attack",350);
  assert.equal(initial.vertices.length,mesh.count*6);
  assert.ok(initial.vertices.some((value,i)=>value!==attack.vertices[i]));
  const hit=sampleVehicleGltf(mesh,"hit",110),death=sampleVehicleGltf(mesh,"death",650);
  // Child rigid assembly must animate independently of hull in idle.
  const a=sampleVehicleGltf(mesh,"idle",0),b=sampleVehicleGltf(mesh,"idle",235);
  const relative=(pose,index)=>Array.from(pose.vertices.slice(index*6,index*6+3))
   .map((v,k)=>v-pose.vertices[k]);
  assert.notDeepEqual(relative(a,mesh.baseCount),relative(b,mesh.baseCount));
  assert.ok(initial.vertices.some((v,i)=>v!==hit.vertices[i]));
  assert.ok(initial.vertices.some((v,i)=>v!==death.vertices[i]));
  assert.deepEqual(sampleVehicleGltf(mesh,"death",650).vertices,
   sampleVehicleGltf(mesh,"death",12000).vertices);
 }
});
test("vehicle glTF input validation rejects skin attachment, malformed buffers and unsafe paths",async()=>{
 const doc=await source();
 doc.skins=[{}];assert.throws(()=>parseVehicleGltf(doc),/Invalid specialized/);
 delete doc.skins;
 doc.nodes[0].children=[];
 assert.throws(()=>parseVehicleGltf(doc),/Invalid specialized/);
 doc.nodes[0].children=[1];
 doc.animations[0].channels[2].target.node=42;
 assert.throws(()=>parseVehicleGltf(doc),/Invalid vehicle track/);
 const loader=createVehicleGltfLoader(async()=>({ok:false}));
 await assert.rejects(loader.load("Ursa","Bomber"),/unavailable/);
 await assert.rejects(loader.load("Ursa","Archer"),/Unsupported/);
 assert.throws(()=>sampleVehicleGltf(null),/Invalid/);
});
