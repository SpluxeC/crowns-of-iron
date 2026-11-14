/** End-to-end test of packaged distribution, not the checked-out source tree. */
import {spawn} from "node:child_process";
import {createServer} from "node:net";
import {mkdtemp,rm,access,readFile} from "node:fs/promises";
import {tmpdir} from "node:os";
import {join,resolve,dirname} from "node:path";
import {fileURLToPath} from "node:url";
import assert from "node:assert/strict";
const root=resolve(dirname(fileURLToPath(import.meta.url)),"..");
const bundle=join(root,"dist","crowns-of-iron-local");
const temp=await mkdtemp(join(tmpdir(),"crowns-playtest-"));
await access(join(bundle,"package.json"));
await access(join(bundle,"README_PLAYTEST.md"));
const packageInfo=JSON.parse(await readFile(join(bundle,"package.json"),"utf8"));
assert.equal(packageInfo.type,"module");
assert.equal(packageInfo.scripts.start,"node scripts/server.js");
async function port(){
 const server=createServer();
 await new Promise((resolve,reject)=>server.once("error",reject).listen(0,"127.0.0.1",resolve));
 const value=server.address().port;
 await new Promise(resolve=>server.close(resolve));
 return value;
}
const number=await port(),url="http://127.0.0.1:"+number;
const env={...process.env,PORT:String(number),
 CHECKPOINT_FILE:join(temp,"playtest-checkpoint.json"),
 RESET_CHECKPOINT:"1"};
const child=spawn(process.execPath,["scripts/server.js"],{
 cwd:bundle,env,stdio:["ignore","pipe","pipe"]});
let stdout="",stderr="";
child.stdout.on("data",chunk=>{stdout+=chunk.toString();});
child.stderr.on("data",chunk=>{stderr+=chunk.toString();});
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function get(path,options={}){
 const res=await fetch(url+path,{signal:AbortSignal.timeout(8000),...options});
 return res;
}
try{
 const until=Date.now()+20000;let ready=false;
 while(Date.now()<until){
  if(child.exitCode!==null)throw Error("Packaged server exited "+child.exitCode+": "+stderr);
  try{
   const res=await get("/health");
   if(res.ok&&((await res.json()).status==="ok")){ready=true;break;}
  }catch{}
  await sleep(200);
 }
 assert.ok(ready,"Packaged local server did not start: "+stderr);
 for(const path of ["/client","/model-gallery","/webgl3d.js",
  "/buildingArchitecture.js","/terrainAtmosphere.js"]){
  const res=await get(path);
  assert.equal(res.status,200,"Packaged route failed: "+path);
 }
 const token=stdout.match(/^human:\s*(\S+)/m)?.[1];
 assert.ok(token,"Local player session token not displayed");
 const unauthorized=await get("/state");
 assert.equal(unauthorized.status,401);
 const authenticated=await get("/state",{headers:{"x-session-token":token}});
 assert.equal(authenticated.status,200);
 const snapshot=await authenticated.json();
 assert.ok(snapshot.state?.players?.length>=2,"Packaged game state missing");
 const model=await get("/assets/gltf-vehicles/humans/bomber.gltf");
 assert.equal(model.status,200);
 const gltf=await model.json();
 assert.equal(gltf.meshes?.length,4);
 assert.equal(gltf.animations?.length,5);
 console.log(JSON.stringify({packagedServer:true,localOnly:true,
  routesVerified:5,authenticatedState:true,generatedVehicleGltf:true,
  gltfMeshes:gltf.meshes.length,animations:gltf.animations.length}));
}finally{
 child.kill("SIGTERM");
 await Promise.race([new Promise(resolve=>child.once("exit",resolve)),sleep(7000)]);
 if(child.exitCode===null)child.kill("SIGKILL");
 await rm(temp,{recursive:true,force:true});
}
