import test from "node:test";
import assert from "node:assert/strict";
import {addPlanarUvs} from "../web/objUv.js";
import {parseObj} from "../web/objLoader.js";
test("planar face UVs are valid Wavefront vt and preserve real polygons",()=>{
 const raw="mtllib x.mtl\no unit\nv 0 0 0\nv 1 0 0\nv 1 1 0\nv 0 1 0\n"+
  "usemtl cloth\nf 1 2 3 4\n";
 const uv=addPlanarUvs(raw),mesh=parseObj(uv,{cloth:[.7,.5,.4]});
 assert.equal((uv.match(/^vt /gm)??[]).length,4);
 assert.match(uv,/f 1\/1 2\/2 3\/3 4\/4/);
 assert.equal(mesh.triangles,2);
 assert.equal(mesh.uvs.length,12);
 assert.ok(mesh.uvs.some(n=>n!==0));
});
test("UV exporter rejects unsupported geometry and preserves deterministic output",()=>{
 assert.throws(()=>addPlanarUvs(""),/valid/);
 assert.throws(()=>addPlanarUvs("v 0 0 0\nf 1 2 3"),/Invalid OBJ face/);
 const input="v 0 0 0\nv 1 0 0\nv 0 1 0\nf 1 2 3";
 assert.equal(addPlanarUvs(input),addPlanarUvs(input));
});
