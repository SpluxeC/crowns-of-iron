import {readFile} from "node:fs/promises";
import {MODEL_NAMES,parseObj,parseMtl} from "../web/objLoader.js";
import {assetForUnit,assetForBuilding} from "../web/assetManifest.js";
import {runBrowserDeliverySmoke} from "../src/browserDeliverySmoke.js";
import {assert} from "../src/util.js";
const root=new URL("../assets/models/",import.meta.url);
const materials=parseMtl(await readFile(new URL("crowns-palette.mtl",root),"utf8"));
const models=[];
for(const name of MODEL_NAMES){
 const content=await readFile(new URL(name+".obj",root),"utf8");
 const mesh=parseObj(content,materials);
 assert(mesh.triangles>30,"Model missing real triangles");
 models.push({name,triangles:mesh.triangles,vertices:mesh.vertexCount,
  maxHeight:mesh.bounds.max[1]});
}
assert(assetForUnit({archetype:"Worker"}).mesh.endsWith("/worker.obj"));
assert(assetForBuilding("Watchtower").mesh.endsWith("/tower.obj"));
const http=await runBrowserDeliverySmoke();
assert(http.servedMeshes===10&&http.assetTriangles>=models.reduce((n,m)=>n+m.triangles,0));
console.log(JSON.stringify({phase:"7.5–7.8",models,materials:Object.keys(materials).length,
 localHttpGalleryAndAssets:http,
 caveat:"Original OBJ models tested in Node and fake-GPU renderer; hardware browser pixel output and polished animation are not validated"},null,2));
