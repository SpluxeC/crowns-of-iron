import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {parseMtl,parseObj} from "../web/objLoader.js";
import {FACTION_SLUGS} from "../web/factionArt.js";
import {ROSTER_ROLES,ROSTER_MESH_COUNT,rosterMeshPath,roleFamily} from "../web/rosterArt.js";
import {createRosterMeshLoader} from "../web/rosterLoader.js";

const localFetch=async path=>{
 if(!/^\/assets\/models\/(?:roster\/[a-z-]+\/[a-z-]+\.obj|crowns-palette\.mtl)$/.test(path))
  return {ok:false};
 try{
  const content=await readFile(new URL("../"+path.slice(1),import.meta.url),"utf8");
  return {ok:true,text:async()=>content};
 }catch{return {ok:false};}
};
test("all 216 role × faction OBJ files contain real unique archetype-specific geometry",async()=>{
 const palette=parseMtl(await readFile(new URL("../assets/models/crowns-palette.mtl",import.meta.url),"utf8"));
 let count=0;
 for(const faction of FACTION_SLUGS){
  const signatures=new Set();
  for(const role of ROSTER_ROLES){
   const file=await localFetch(rosterMeshPath(faction,role));
   assert.equal(file.ok,true,faction+"/"+role);
   const source=await file.text();
   assert.ok(source.includes("Original archetype-specific 3D art: "+faction+" / "+role));
   const mesh=parseObj(source,palette);
   assert.ok(mesh.triangles>120,faction+"/"+role+" too few triangles");
   const tail=Array.from(mesh.vertices.slice(-18)).join(",");
   signatures.add(role+"|"+mesh.triangles+"|"+tail);
   count++;
  }
  assert.equal(signatures.size,36);
 }
 assert.equal(count,ROSTER_MESH_COUNT);
});
test("bounded roster mesh loader de-duplicates concurrent work and reuses cache",async()=>{
 const counted=[];
 const loader=createRosterMeshLoader(async path=>{counted.push(path);return localFetch(path);});
 const unit=await Promise.all([
  loader.loadOne("Humans","Archer"),loader.loadOne("humans","Archer")]);
 assert.equal(unit[0],unit[1]);
 assert.equal(loader.stats().loaded,1);
 assert.equal(counted.filter(x=>x.endsWith("archer.obj")).length,1);
 assert.ok(loader.get("Humans","Archer").triangles>100);
 const result=await loader.loadBatch([
  {faction:"Humans",role:"Archer"},{faction:"Ursa",role:"Bomber"}]);
 assert.equal(result.loaded,2);
 assert.equal(loader.stats().loaded,2);
 assert.throws(()=>loader.loadBatch(Array.from({length:13},()=>({
  faction:"Humans",role:"Archer"}))),/too large/);
 await assert.rejects(loader.loadOne("Humans","../../secret"),/Invalid/);
});
test("roster loader recovers from missing files and never accepts unlisted identities",async()=>{
 const loader=createRosterMeshLoader(async()=>({ok:false}));
 await assert.rejects(loader.loadOne("Orcs","Worker"),/Roster materials unavailable/);
 assert.equal(loader.stats().errors,1);
 assert.equal(loader.get("Unknown","Worker"),null);
 assert.equal(roleFamily("Heavy War Machine"),"siege");
});
