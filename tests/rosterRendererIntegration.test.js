import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {createWebGLRenderer} from "../web/webgl3d.js";

function fakeGpu(){
 const uploads=[];
 const gl={VERTEX_SHADER:1,FRAGMENT_SHADER:2,COMPILE_STATUS:3,LINK_STATUS:4,
  ARRAY_BUFFER:5,FLOAT:6,TRIANGLES:7,DEPTH_TEST:8,LEQUAL:9,
  COLOR_BUFFER_BIT:16,DEPTH_BUFFER_BIT:32,STATIC_DRAW:100,DYNAMIC_DRAW:101,
  createShader:()=>({}),shaderSource(){},compileShader(){},getShaderParameter:()=>true,
  createProgram:()=>({}),attachShader(){},linkProgram(){},getProgramParameter:()=>true,
  getAttribLocation:(_,name)=>name==="a_position"?0:1,getUniformLocation:()=>({}),
  createBuffer:()=>({}),enable(){},depthFunc(){},viewport(){},clearColor(){},
  clear(){},useProgram(){},bindBuffer(){},enableVertexAttribArray(){},
  vertexAttribPointer(){},uniform3f(){},uniform1f(){},drawArrays(){},
  bufferData:(_,data,usage)=>uploads.push({content:Array.from(data),usage}),
  deleteBuffer(){},deleteProgram(){},deleteShader(){}
 };
 return {canvas:{width:800,height:640,getContext:()=>gl},uploads};
}
const localFetch=async path=>{
 if(!/^\/assets\/models\/(?:roster\/[a-z-]+\/[a-z-]+\.obj|crowns-palette\.mtl)$/.test(path))
  return {ok:false};
 try{
  const text=await readFile(new URL("../"+path.slice(1),import.meta.url),"utf8");
  return {ok:true,text:async()=>text};
 }catch{return {ok:false};}
};
test("roster-specific mesh replaces fallback unit and contributes genuine UV-authored triangles",async()=>{
 const gpu=fakeGpu(),renderer=createWebGLRenderer(gpu.canvas);
 const width=8,height=8,world={width,height,
  tiles:Array.from({length:width*height},(_,i)=>({
   x:i%width,y:Math.floor(i/width),terrain:"grass"})),structures:[]};
 const unit={id:"A",alive:true,x:3,y:3,archetype:"Pikeman",hp:100,maxHp:100};
 const match={viewerId:"p0",elapsedMs:0,orders:{},
  players:[{id:"p0",faction:"Humans",units:[unit]}]};
 renderer.draw(world,match,new Set());
 assert.equal(renderer.stats().fallbackUnits,1);
 const before=gpu.uploads.at(-1).content.length;
 const batch=await renderer.loadRosterAssets({fetcher:localFetch,requests:[
  {faction:"Humans",role:"Pikeman"}]});
 assert.equal(batch.loaded,1);
 assert.equal(renderer.rosterLoadStatus().loaded,1);
 const mesh=renderer.rosterMeshInfo("Humans","Pikeman");
 assert.ok(mesh.triangles>100);
 renderer.draw(world,match,new Set());
 assert.equal(renderer.stats().modelUnits,1);
 assert.equal(renderer.stats().fallbackUnits,0);
 assert.ok(gpu.uploads.at(-1).content.length>before);
 match.orders[unit.id]={kind:"move",path:[{x:4,y:3}]};
 match.elapsedMs=200;
 renderer.draw(world,match,new Set());
 const posed=gpu.uploads.at(-1).content;
 match.elapsedMs=380;
 renderer.draw(world,match,new Set());
 assert.notDeepEqual(gpu.uploads.at(-1).content,posed);
 renderer.dispose();
});
