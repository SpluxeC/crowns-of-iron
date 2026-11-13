import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {createWebGLRenderer} from "../web/webgl3d.js";
function mockGpu(){
 const uploads=[];
 const gl={VERTEX_SHADER:1,FRAGMENT_SHADER:2,COMPILE_STATUS:3,LINK_STATUS:4,
  ARRAY_BUFFER:5,FLOAT:6,TRIANGLES:7,DEPTH_TEST:8,LEQUAL:9,
  COLOR_BUFFER_BIT:16,DEPTH_BUFFER_BIT:32,STATIC_DRAW:100,DYNAMIC_DRAW:101,
  createShader:()=>({}),shaderSource(){},compileShader(){},getShaderParameter:()=>true,
  createProgram:()=>({}),attachShader(){},linkProgram(){},getProgramParameter:()=>true,
  getAttribLocation:(_,name)=>name==="a_position"?0:1,getUniformLocation:(_,name)=>name,
  createBuffer:()=>({}),enable(){},depthFunc(){},viewport(){},clearColor(){},
  clear(){},useProgram(){},bindBuffer(){},enableVertexAttribArray(){},
  vertexAttribPointer(){},uniform3f(){},uniform1f(){},drawArrays(){},
  bufferData:(target,data,usage)=>uploads.push({vertices:data.length/6,usage}),
  deleteBuffer(){},deleteProgram(){},deleteShader(){}
 };
 return {canvas:{getContext:()=>gl,width:800,height:640},uploads};
}
const makeWorld=()=>{
 const width=20,height=20;
 return {width,height,tiles:Array.from({length:width*height},(_,i)=>({
  x:i%width,y:Math.floor(i/width),terrain:"grass",occupied:null})),
  structures:[{id:"s",kind:"Farm",x:8,y:8,width:2,height:2}]};
};
const fetchLocal=async path=>{
 const name=path.split("/").at(-1);
 if(!/^[a-z-]+\.(?:obj|mtl)$/.test(name))return {ok:false};
 try{
  const text=await readFile(new URL("../assets/models/"+name,import.meta.url),"utf8");
  return {ok:true,text:async()=>text};
 }catch{return {ok:false};}
};
test("all ten actual OBJ assets replace proxy meshes in the GPU render path",async()=>{
 const gpu=mockGpu(),renderer=createWebGLRenderer(gpu.canvas);
 const world=makeWorld(),match={viewerId:"a",players:[{id:"a",units:[
  {id:"one",alive:true,x:9,y:9,archetype:"Worker",hp:100,maxHp:100}]}]};
 renderer.draw(world,match,new Set());
 assert.equal(renderer.stats().modelUnits,0);
 assert.equal(renderer.stats().fallbackUnits,1);
 const originalUpload=gpu.uploads.at(-1).vertices;
 const loaded=await renderer.loadAssets({fetcher:fetchLocal});
 assert.equal(loaded.models,10);
 assert.equal(renderer.meshInfo("worker").triangles>100,true);
 renderer.draw(world,match,new Set());
 assert.equal(renderer.stats().modelUnits,1);
 assert.equal(renderer.stats().modelBuildings,1);
 assert.equal(renderer.stats().fallbackUnits,0);
 assert.equal(renderer.stats().loadedModels,10);
 assert.ok(gpu.uploads.at(-1).vertices>originalUpload);
 assert.equal(renderer.stats().terrainRebuilds,2);
 renderer.draw(world,match,new Set());
 assert.equal(renderer.stats().terrainRebuilds,2);
 renderer.dispose();
});
test("renderer remains usable with fallback meshes after OBJ fetch failure",async()=>{
 const gpu=mockGpu(),renderer=createWebGLRenderer(gpu.canvas);
 await assert.rejects(renderer.loadAssets({fetcher:async()=>({ok:false})}),/palette/);
 const world=makeWorld();
 renderer.draw(world,{viewerId:"a",players:[{id:"a",units:[{
  id:"one",alive:true,x:5,y:5,archetype:"Swordsman",hp:10,maxHp:50}]}]},new Set(["one"]));
 assert.equal(renderer.stats().fallbackUnits,1);
 assert.match(renderer.stats().modelFailure,/palette/);
});
test("per-draw OBJ detail cap switches to fallback geometry for large visible armies",async()=>{
 const gpu=mockGpu(),renderer=createWebGLRenderer(gpu.canvas);
 await renderer.loadAssets({fetcher:fetchLocal});
 const units=Array.from({length:165},(_,i)=>({id:"unit-"+i,alive:true,
  archetype:"Swordsman",hp:100,maxHp:100,x:i%20,y:Math.floor(i/20)}));
 renderer.draw(makeWorld(),{viewerId:"a",players:[{id:"a",units}]},new Set());
 assert.equal(renderer.stats().modelUnits,160);
 assert.equal(renderer.stats().fallbackUnits,5);
});
