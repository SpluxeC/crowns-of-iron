import test from "node:test";
import assert from "node:assert/strict";
import {appendUvMesh,createUvTextureRenderer} from "../web/textureShader.js";
test("texture renderer declines unsupported WebGL context without affecting fallback",()=>{
 assert.equal(createUvTextureRenderer({}),null);
 const vertices=[],mesh={textured:true,vertexCount:1,
  vertices:new Float32Array([1,2,3,.8,.7,.6]),
  uvs:new Float32Array([.25,.75])};
 appendUvMesh(vertices,mesh,{x:2,y:1,z:3});
 assert.deepEqual(vertices.slice(0,3),[3,3,6]);
 assert.deepEqual(vertices.slice(6),[.25,.75]);
 assert.throws(()=>appendUvMesh([],{textured:false}),/UV geometry/);
});
