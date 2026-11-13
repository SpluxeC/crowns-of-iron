import test from "node:test";
import assert from "node:assert/strict";
import {gltfForFaction,gltfCacheStats} from "../src/gltfAssets.js";
import {FACTION_SLUGS} from "../web/factionArt.js";
import {SKINNED_ROLES,SKINNED_ASSET_COUNT,skinnedGltfPath} from "../web/skinnedRoster.js";
import {validateSkinnedGltf,sampleSkinnedGltf,blendJointPoses,
 createSkinnedGltfLoader} from "../web/skinnedGltf.js";

test("all 36 humanoid faction/role variants generate valid weighted animated glTF",async()=>{
 let total=0,blended=0;
 for(const faction of FACTION_SLUGS)for(const role of SKINNED_ROLES){
  const text=await gltfForFaction(faction,role);
  const data=validateSkinnedGltf(JSON.parse(text));
  assert.equal(data.pivots.length,7);
  assert.equal(data.textureEmbedded,true);
  assert.equal(data.material.pbrMetallicRoughness.baseColorTexture.index,0);
  assert.ok(data.count>50);
  assert.ok(data.weights.every(weight=>weight>=0&&weight<=1));
  if(data.weights.some((v,i)=>i%4===1&&v>.01))blended++;
  const idle=sampleSkinnedGltf(data,"idle",0),
   attack=sampleSkinnedGltf(data,"attack",250);
  assert.ok(idle.vertices.some((v,i)=>v!==attack.vertices[i]));
  assert.match(skinnedGltfPath(faction,role),/\.gltf$/);
  total++;
 }
 assert.equal(total,SKINNED_ASSET_COUNT);
 assert.equal(blended,SKINNED_ASSET_COUNT);
 assert.ok(gltfCacheStats().loaded>=SKINNED_ASSET_COUNT);
 assert.equal(skinnedGltfPath("Humans","Bomber"),null);
});
test("crossfade smoothly interpolates joint poses without changing vertex counts",async()=>{
 const data=validateSkinnedGltf(JSON.parse(await gltfForFaction("humans","Archer")));
 const previous=sampleSkinnedGltf(data,"idle",180);
 const attack=sampleSkinnedGltf(data,"attack",180);
 const start=sampleSkinnedGltf(data,"attack",180,{transitionFrom:"idle",transitionAlpha:0});
 const middle=sampleSkinnedGltf(data,"attack",180,{transitionFrom:"idle",transitionAlpha:.5});
 const end=sampleSkinnedGltf(data,"attack",180,{transitionFrom:"idle",transitionAlpha:1});
 assert.deepEqual(start.vertices,previous.vertices);
 assert.deepEqual(end.vertices,attack.vertices);
 assert.notDeepEqual(middle.vertices,start.vertices);
 assert.notDeepEqual(middle.vertices,end.vertices);
 assert.equal(start.vertexCount,middle.vertexCount);
 assert.throws(()=>blendJointPoses([],[],.5),/pose length/);
 assert.throws(()=>blendJointPoses(Array(7).fill([0,0,0,1]),
  Array(7).fill([0,0,0,1]),1.1),/blend factor/);
});
test("archetype glTF loader coalesces requests and rejects unlisted roles",async()=>{
 const paths=[];
 const fetcher=async path=>{paths.push(path);
  const parts=path.split("/");
  const text=await gltfForFaction(parts[3],SKINNED_ROLES.find(x=>
   x.toLowerCase()===parts[4].replace(".gltf",""))??"Swordsman");
  return {ok:true,text:async()=>text};
 };
 const loader=createSkinnedGltfLoader(fetcher);
 const [a,b]=await Promise.all([loader.load("Ursa","Hero"),loader.load("Ursa","Hero")]);
 assert.equal(a,b);assert.equal(paths.length,1);
 assert.equal(loader.get("Ursa","Hero"),a);
 await assert.rejects(loader.load("Ursa","Bomber"),/Invalid/);
});
