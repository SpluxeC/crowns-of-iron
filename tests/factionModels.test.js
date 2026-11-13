import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {MODEL_NAMES,parseMtl,parseObj,appendObjVertices,loadFactionObjSet} from "../web/objLoader.js";
import {FACTION_SLUGS,factionMeshPath} from "../web/factionArt.js";
import {loadFactionTextures,textureForFaction} from "../web/factionTextures.js";
import {poseAt} from "../web/meshAnimation.js";
import {createWebGLRenderer} from "../web/webgl3d.js";

const localFetch=async path=>{
 if(!/^\/assets\/(?:models|textures)\/[a-z0-9/_-]+\.(?:obj|mtl|ppm)$/.test(path))
  return {ok:false};
 try{
  const content=await readFile(new URL("../"+path.slice(1),import.meta.url),"utf8");
  return {ok:true,text:async()=>content};
 }catch{return {ok:false};}
};
function fakeGpu(){
 const uploads=[],gl={
  VERTEX_SHADER:1,FRAGMENT_SHADER:2,COMPILE_STATUS:3,LINK_STATUS:4,
  ARRAY_BUFFER:5,FLOAT:6,TRIANGLES:7,DEPTH_TEST:8,LEQUAL:9,
  COLOR_BUFFER_BIT:16,DEPTH_BUFFER_BIT:32,STATIC_DRAW:100,DYNAMIC_DRAW:101,
  createShader:()=>({}),shaderSource(){},compileShader(){},getShaderParameter:()=>true,
  createProgram:()=>({}),attachShader(){},linkProgram(){},getProgramParameter:()=>true,
  getAttribLocation:(_,name)=>name==="a_position"?0:1,getUniformLocation:()=>({}),
  createBuffer:()=>({}),enable(){},depthFunc(){},viewport(){},clearColor(){},
  clear(){},useProgram(){},bindBuffer(){},enableVertexAttribArray(){},
  vertexAttribPointer(){},uniform3f(){},uniform1f(){},drawArrays(){},
  bufferData:(target,data,usage)=>uploads.push({vertices:data.length/6,usage}),
  deleteBuffer(){},deleteProgram(){},deleteShader(){}
 };
 return {canvas:{width:800,height:640,getContext:()=>gl},uploads};
}
const world=()=>{
 const width=18,height=18;
 return {width,height,tiles:Array.from({length:width*height},(_,i)=>({
  x:i%width,y:Math.floor(i/width),terrain:"grass",occupied:null})),
  structures:[{id:"tower",owner:"human",kind:"Watchtower",
   x:9,y:9,width:2,height:2}]};
};
test("all sixty committed faction OBJ meshes are individually valid and visually distinguishable",async()=>{
 const res=await localFetch("/assets/models/crowns-palette.mtl");
 const materials=parseMtl(await res.text());
 let count=0;
 for(const role of MODEL_NAMES){
  const reference=await localFetch("/assets/models/"+role+".obj");
  const base=parseObj(await reference.text(),materials);
  const signatures=new Set();
  for(const faction of FACTION_SLUGS){
   const response=await localFetch(factionMeshPath(faction,role));
   assert(response.ok,"Missing "+faction+"/"+role);
   const source=await response.text();
   assert.match(source,new RegExp(faction+"_(?:primary|armor|skin|trim)"));
   const mesh=parseObj(source,materials);
   assert.ok(mesh.triangles>base.triangles,"No unique detail "+faction+"/"+role);
   assert.ok(mesh.vertexCount>base.vertexCount,"No extra geometry "+faction+"/"+role);
   signatures.add(JSON.stringify([mesh.bounds.max,mesh.bounds.min,
    Array.from(mesh.vertices.slice(-18))]));
   count++;
  }
  assert.equal(signatures.size,6,"Faction variants share identical geometry for "+role);
 }
 assert.equal(count,60);
});
test("all faction textures and poses transform the real loaded OBJ vertex colors and positions",async()=>{
 const [meshes,textures]=await Promise.all([
  loadFactionObjSet(localFetch),loadFactionTextures(localFetch)]);
 assert.equal(Object.keys(meshes).length,60);
 assert.equal(Object.keys(textures).length,6);
 const mesh=meshes["orcs/infantry"],texture=textureForFaction(textures,"Orcs");
 const bare=[],colored=[],walking=[],attacking=[];
 appendObjVertices(bare,mesh,{});
 appendObjVertices(colored,mesh,{texture});
 appendObjVertices(walking,mesh,{texture,pose:poseAt("walk",340)});
 appendObjVertices(attacking,mesh,{texture,pose:poseAt("attack",220)});
 assert.equal(bare.length,colored.length);
 assert.notDeepEqual(colored,bare);
 assert.notDeepEqual(walking,colored);
 assert.notDeepEqual(attacking,walking);
});
test("WebGL actually draws faction units and buildings from the 60 OBJ meshes",async()=>{
 const gpu=fakeGpu(),renderer=createWebGLRenderer(gpu.canvas);
 await renderer.loadAssets({fetcher:localFetch});
 const variants=await renderer.loadFactionAssets({fetcher:localFetch});
 assert.equal(variants.factionModels,60);
 assert.equal(variants.textures,6);
 assert.equal(renderer.stats().loadedModels,70);
 const mesh=renderer.meshInfo("worker","Orcs");
 assert.ok(mesh.triangles>renderer.meshInfo("worker").triangles);
 const match={viewerId:"human",elapsedMs:560,orders:{},
  players:[{id:"human",faction:"Humans",units:[{id:"a",alive:true,x:5,y:5,
    archetype:"Worker",hp:100,maxHp:100}]},
   {id:"enemy",faction:"Orcs",units:[{id:"b",alive:true,x:6,y:5,
    archetype:"Swordsman",hp:100,maxHp:100}]}]};
 renderer.draw(world(),match,new Set());
 assert.equal(renderer.stats().modelUnits,2);
 assert.equal(renderer.stats().modelBuildings,1);
 assert.equal(renderer.stats().factionTextures,6);
 assert.ok(gpu.uploads.at(-1).vertices>700);
 renderer.dispose();
});
