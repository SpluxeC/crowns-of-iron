import test from "node:test";
import assert from "node:assert/strict";
import {createWebGLRenderer,terrainSignature,cameraForMap,projectWorld,
 raycastTerrain} from "../web/webgl3d.js";
function fakeCanvas(){
 const sources=[],uploads=[],draws=[];
 const gl={
  VERTEX_SHADER:1,FRAGMENT_SHADER:2,COMPILE_STATUS:3,LINK_STATUS:4,
  ARRAY_BUFFER:5,FLOAT:6,TRIANGLES:7,DEPTH_TEST:8,LEQUAL:9,
  COLOR_BUFFER_BIT:16,DEPTH_BUFFER_BIT:32,STATIC_DRAW:100,DYNAMIC_DRAW:101,
  createShader:type=>({type}),shaderSource:(s,text)=>sources.push(text),
  compileShader(){},getShaderParameter:()=>true,getShaderInfoLog:()=>"",
  createProgram:()=>({}),attachShader(){},linkProgram(){},
  getProgramParameter:()=>true,getProgramInfoLog:()=>"",
  getAttribLocation:(_,name)=>name==="a_position"?0:1,
  getUniformLocation:(_,name)=>name,createBuffer:()=>({}),
  enable(){},depthFunc(){},viewport(){},clearColor(){},clear(){},
  useProgram(){},bindBuffer(){},bufferData:(target,data,usage)=>uploads.push({length:data.length,usage}),
  enableVertexAttribArray(){},vertexAttribPointer(){},
  uniform3f(){},uniform1f(){},drawArrays:(type,first,count)=>draws.push(count),
  deleteBuffer(){},deleteShader(){},deleteProgram(){}
 };
 return {canvas:{width:800,height:640,getContext:()=>gl},sources,uploads,draws};
}
test("GPU terrain buffer remains cached during moving-unit frames and camera changes",()=>{
 const f=fakeCanvas(),renderer=createWebGLRenderer(f.canvas);
 const world={width:2,height:2,tiles:[
  {x:0,y:0,terrain:"grass"},{x:1,y:0,terrain:"forest"},
  {x:0,y:1,terrain:"water"},{x:1,y:1,terrain:"hill"}]};
 const match={viewerId:"a",players:[{id:"a",units:[{
  id:"unit",x:0,y:0,alive:true,archetype:"Worker"}]}]};
 renderer.draw(world,match,new Set());
 assert.equal(renderer.stats().terrainRebuilds,1);
 assert.deepEqual(f.uploads.map(x=>x.usage),[100,101]);
 match.players[0].units[0].x=1;
 renderer.orbit(10,3);renderer.zoom(-1);
 renderer.draw(world,match,new Set(["unit"]));
 assert.equal(renderer.stats().terrainRebuilds,1);
 assert.deepEqual(f.uploads.map(x=>x.usage),[100,101,101]);
 world.tiles[0].terrain="deposit";
 renderer.draw(world,match,new Set());
 assert.equal(renderer.stats().terrainRebuilds,2);
 assert.equal(f.uploads.filter(x=>x.usage===100).length,2);
 assert.equal(f.draws.length,6);
 renderer.dispose();
});
test("WebGL perspective shader uses clip-space w=depth and positive visibility",()=>{
 const f=fakeCanvas();createWebGLRenderer(f.canvas);
 const vertex=f.sources.find(x=>x.includes("gl_Position"));
 assert.ok(vertex.includes("clipZ,depth"));
 assert.ok(!vertex.includes("clamp(depth/150.0"));
 const cam=cameraForMap(40,32),world={width:40,height:32,
  tiles:Array.from({length:40*32},(_,i)=>({x:i%40,y:Math.floor(i/40),terrain:"grass"}))};
 const pt=projectWorld({x:20.5,y:.12,z:16.5},800,640,cam);
 assert.deepEqual(raycastTerrain(cam,pt.x,pt.y,800,640,world),{x:20,y:16});
 assert.notEqual(terrainSignature(world),terrainSignature({...world,
  tiles:world.tiles.map((t,i)=>i===0?{...t,terrain:"hill"}:t)}));
});
