import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {parsePpm} from "../web/factionTextures.js";
import {appendUvMesh,createUvTextureRenderer} from "../web/textureShader.js";
import {gltfForFaction} from "../src/gltfAssets.js";
import {validateSkinnedGltf,sampleSkinnedGltf} from "../web/skinnedGltf.js";
function fake(){
 const calls={textures:0,uploads:0,triangles:0,shaderSources:[]};
 const gl={VERTEX_SHADER:1,FRAGMENT_SHADER:2,COMPILE_STATUS:3,LINK_STATUS:4,
 ARRAY_BUFFER:5,FLOAT:6,TRIANGLES:7,DYNAMIC_DRAW:8,TEXTURE_2D:9,
 RGB:10,UNSIGNED_BYTE:11,TEXTURE_WRAP_S:12,TEXTURE_WRAP_T:13,
 TEXTURE_MIN_FILTER:14,TEXTURE_MAG_FILTER:15,NEAREST:16,REPEAT:17,TEXTURE0:18,
 UNPACK_ALIGNMENT:19,
 createShader:()=>({}),shaderSource:(_,source)=>calls.shaderSources.push(source),
 compileShader(){},getShaderParameter:()=>true,createProgram:()=>({}),
 attachShader(){},linkProgram(){},getProgramParameter:()=>true,
 getAttribLocation:(_,name)=>({a_position:0,a_color:1,a_uv:2})[name],
 getUniformLocation:(_,name)=>name,
 createBuffer:()=>({}),createTexture:()=>({}),
 enableVertexAttribArray(){},vertexAttribPointer(){},uniform3f(){},
 uniform1f(){},uniform1i(){},useProgram(){},activeTexture(){},
 bindTexture(){},bindBuffer(){},texParameteri(){},pixelStorei(){},
 bufferData:(_,data)=>{assert.equal(data.length%8,0);calls.uploads++;},
 texImage2D:(...args)=>{assert.equal(args.at(-1).length,3072);calls.textures++;},
 drawArrays:(_,__,count)=>calls.triangles+=count/3,
 deleteTexture(){},deleteBuffer(){},deleteProgram(){},deleteShader(){}
 };
 return {gl,calls};
}
test("real skinned glTF plus faction PPM uses GPU UV pixel shader and caches the texture",async()=>{
 const gltf=validateSkinnedGltf(JSON.parse(await gltfForFaction("humans")));
 const mesh=sampleSkinnedGltf(gltf,"walk",240);
 const texture=parsePpm(await readFile(
  new URL("../assets/textures/factions/humans.ppm",import.meta.url),"utf8"));
 const vertices=[];appendUvMesh(vertices,mesh,{x:4,y:1,z:3,scale:.6});
 assert.equal(vertices.length,mesh.vertexCount*8);
 const {gl,calls}=fake(),shader=createUvTextureRenderer(gl);
 assert.ok(shader);
 const camera={eye:{x:0,y:9,z:10},right:{x:1,y:0,z:0},
 up:{x:0,y:1,z:0},forward:{x:0,y:-.4,z:-.9},tanHalfFov:.56};
 shader.draw(new Map([["humans",vertices]]),{humans:texture},camera,
  {width:800,height:600});
 assert.equal(shader.stats().textures,1);
 assert.equal(shader.stats().texturedVertices,mesh.vertexCount);
 assert.equal(calls.textures,1);
 assert.equal(calls.triangles,mesh.triangles);
 assert.ok(calls.shaderSources.some(s=>s.includes("texture2D")));
 shader.draw(new Map([["humans",vertices]]),{humans:texture},camera,
  {width:800,height:600});
 assert.equal(calls.textures,1,"GPU texture must be reused, not uploaded each draw");
 shader.dispose();
});
