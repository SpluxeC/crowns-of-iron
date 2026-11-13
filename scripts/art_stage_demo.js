import {readFile} from "node:fs/promises";
import {FACTION_SLUGS} from "../web/factionArt.js";
import {ROSTER_ROLES,ROSTER_MESH_COUNT,rosterMeshPath} from "../web/rosterArt.js";
import {parseObj,parseMtl} from "../web/objLoader.js";
import {createRosterMeshLoader} from "../web/rosterLoader.js";
import {ANIMATION_CLIPS,sampleAnimationClip} from "../web/animationClips.js";
import {runBrowserDeliverySmoke} from "../src/browserDeliverySmoke.js";
import {assert} from "../src/util.js";
const materials=parseMtl(await readFile(new URL("../assets/models/crowns-palette.mtl",import.meta.url),"utf8"));
const roster={land:0,naval:0,air:0},families=new Set();
let uvMeshes=0,triangles=0;
const fetchLocal=async path=>{
 try{
  const text=await readFile(new URL("../"+path.slice(1),import.meta.url),"utf8");
  return {ok:true,text:async()=>text};
 }catch{return {ok:false};}
};
for(const faction of FACTION_SLUGS)for(let i=0;i<ROSTER_ROLES.length;i++){
 const role=ROSTER_ROLES[i],file=await fetchLocal(rosterMeshPath(faction,role));
 assert(file.ok,"Missing archetype "+faction+"/"+role);
 const mesh=parseObj(await file.text(),materials);
 assert(mesh.textured&&mesh.uvs.length===mesh.vertexCount*2);
 assert(mesh.triangles>120);
 uvMeshes++;triangles+=mesh.triangles;
 const category=i<22?"land":i<30?"naval":"air";
 roster[category]++;
}
assert(uvMeshes===ROSTER_MESH_COUNT);
const cache=createRosterMeshLoader(fetchLocal);
const selected=await cache.loadBatch([
 {faction:"Humans",role:"Pikeman"},{faction:"Orcs",role:"Bomber"}]);
assert(selected.loaded===2&&cache.stats().loaded===2);
const clips=JSON.parse(await readFile(new URL("../assets/animations/rig-clips.json",import.meta.url),"utf8"));
assert(JSON.stringify(clips.clips)===JSON.stringify(ANIMATION_CLIPS));
assert(sampleAnimationClip("walk",180).angles.leftArm!==0);
const smoke=await runBrowserDeliverySmoke();
assert(smoke.rosterSmokeMeshes===36&&smoke.authoredClips===3);
console.log(JSON.stringify({milestones:"8.3–8.6",factions:FACTION_SLUGS.length,
 totalUnitMeshes:uvMeshes,rolesPerFaction:ROSTER_ROLES.length,
 unitDomains:roster,uvMappedTriangleCount:triangles,
 selectivelyLoadedDemoModels:selected.loaded,authoredKeyframeClips:Object.keys(ANIMATION_CLIPS).length,
 httpVerifiedRosterSamples:smoke.rosterSmokeMeshes,
 caveats:"Procedural assets; CPU UV-to-vertex-color sampling, non-skinned keyframe joint curves, no real-browser pixel/GPU verification"},null,2));
