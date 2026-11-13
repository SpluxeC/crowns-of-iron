import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {parseMtl,parseObj,MODEL_NAMES,appendObjVertices} from "../web/objLoader.js";
const root=new URL("../assets/models/",import.meta.url);
test("all ten committed Wavefront meshes have real faces, sane bounds and defined materials",async()=>{
 const mtl=parseMtl(await readFile(new URL("crowns-palette.mtl",root),"utf8"));
 assert.ok(Object.keys(mtl).length>=10);
 const seen=new Set();
 for(const name of MODEL_NAMES){
  const data=await readFile(new URL(name+".obj",root),"utf8");
  assert.match(data,/^mtllib crowns-palette.mtl/m);
  const mesh=parseObj(data,mtl);
  assert.ok(mesh.triangles>=30,name);
  assert.ok(mesh.bounds.max[1]>.5,name);
  assert.ok(mesh.bounds.min[0]<mesh.bounds.max[0],name);
  assert.equal(mesh.vertices.length,mesh.triangles*18);
  seen.add(name);
 }
 assert.equal(seen.size,10);
});
test("OBJ parser rejects missing materials, overbroad commands and malformed faces",()=>{
 assert.throws(()=>parseObj("v 0 0 0\nv 1 0 0\nv 0 1 0\nusemtl missing\nf 1 2 3",{}),/Undefined/);
 assert.throws(()=>parseObj("v 0 0 0\nexec exploit\n",{}),/Unsupported/);
 assert.throws(()=>parseObj("v 0 0 0\nf 1 9 1",{}),/index/);
 assert.throws(()=>parseObj("v 0 0 0",{}),/no triangles/);
});
test("mesh transform puts local Y-up vertices into world and supports team tint",()=>{
 const mesh=parseObj("v 0 0 0\nv 1 0 0\nv 0 1 0\nusemtl cloth\nf 1 2 3",
  {cloth:[.8,.5,.3]});
 const out=[];appendObjVertices(out,mesh,{x:4,y:2,z:6,scale:2,tint:[.5,1,1]});
 assert.equal(out.length,18);
 assert.deepEqual(out.slice(0,3),[4,2,6]);
 assert.equal(out[6],6);
 assert.ok(out[3]<mesh.vertices[3]);
});
