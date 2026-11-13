import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {parseObj,parseMtl} from "../web/objLoader.js";
import {parsePpm} from "../web/factionTextures.js";
import {refineFactionTexture} from "../web/materialDetail.js";
import {exportVehicleGltf} from "../scripts/export_vehicle_gltf.js";
test("specialized vehicle glTF has real UV mesh and five valid transform animations",async()=>{
 const palette=parseMtl(await readFile(new URL("../assets/models/crowns-palette.mtl",import.meta.url),"utf8"));
 const mesh=parseObj(await readFile(new URL("../assets/models/roster/humans/bomber.obj",import.meta.url),"utf8"),palette);
 const texture=refineFactionTexture(parsePpm(await readFile(
  new URL("../assets/textures/factions/humans.ppm",import.meta.url),"utf8")),"humans");
 const doc=exportVehicleGltf(mesh,texture,{role:"Bomber"});
 assert.equal(doc.asset.version,"2.0");
 assert.equal(doc.skins,undefined);
 assert.equal(doc.animations.length,5);
 assert.deepEqual(doc.animations.map(c=>c.name),["idle","walk","attack","hit","death"]);
 assert.ok(doc.animations.every(c=>c.channels.length===5));
 assert.equal(doc.meshes.length,4);
 assert.equal(doc.nodes.length,4);
 assert.deepEqual(doc.nodes[0].children,[1,2,3]);
 for(let i=1;i<4;i++)assert.equal(doc.nodes[i].mesh,i);
 assert.ok(doc.animations.every(c=>c.channels[2].target.node===1 &&
  c.channels[2].target.path==="rotation"));
 assert.ok(doc.animations.every(c=>[1,2,3].every((node,i)=>
  c.channels[i+2].target.node===node&&c.channels[i+2].target.path==="rotation")));
 assert.ok(doc.animations.every(c=>c.channels[0].target.path==="translation"));
 assert.ok(doc.animations.every(c=>c.channels[1].target.path==="rotation"));
 assert.equal(doc.meshes[0].primitives[0].mode,4);
 assert.ok(doc.images[0].uri.startsWith("data:image/png;base64,"));
 assert.equal(doc.accessors[doc.meshes[0].primitives[0].attributes.POSITION].count,
  mesh.vertexCount);
 assert.throws(()=>exportVehicleGltf(mesh,texture,{role:"Archer"}),/vehicle/);
});
