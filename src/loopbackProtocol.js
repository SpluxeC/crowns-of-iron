import {createServer} from "node:http";
import {readFile} from "node:fs/promises";
import {assert} from "./util.js";
import {FACTION_SLUGS} from "../web/factionArt.js";
import {MODEL_NAMES} from "../web/objLoader.js";
import {ROSTER_ROLES,ROLE_SLUGS} from "../web/rosterArt.js";
import {gltfForFaction} from "./gltfAssets.js";
import {vehicleAssetFor} from "./vehicleAssets.js";
import {VEHICLE_ROLES,vehicleGltfPath} from "../web/vehicleArt.js";
import {ALL_SKINNED_ROLES,skinnedGltfPath} from "../web/skinnedRoster.js";

// Same-origin loopback development transport. Never publicly bind this server.
const STATIC={
 "/client":["../web/netplay.html","text/html; charset=utf-8"],
 "/model-gallery":["../web/modelGallery.html","text/html; charset=utf-8"],
 "/modelGallery.js":["../web/modelGallery.js","text/javascript; charset=utf-8"],
 "/netplay.js":["../web/netplay.js","text/javascript; charset=utf-8"],
 "/webgl3d.js":["../web/webgl3d.js","text/javascript; charset=utf-8"],
 "/assetManifest.js":["../web/assetManifest.js","text/javascript; charset=utf-8"],
 "/objLoader.js":["../web/objLoader.js","text/javascript; charset=utf-8"],
 "/assets/models/crowns-palette.mtl":["../assets/models/crowns-palette.mtl","text/plain; charset=utf-8"],
 "/assets/models/worker.obj":["../assets/models/worker.obj","text/plain; charset=utf-8"],
 "/assets/models/infantry.obj":["../assets/models/infantry.obj","text/plain; charset=utf-8"],
 "/assets/models/ranged.obj":["../assets/models/ranged.obj","text/plain; charset=utf-8"],
 "/assets/models/hero.obj":["../assets/models/hero.obj","text/plain; charset=utf-8"],
 "/assets/models/siege.obj":["../assets/models/siege.obj","text/plain; charset=utf-8"],
 "/assets/models/ship.obj":["../assets/models/ship.obj","text/plain; charset=utf-8"],
 "/assets/models/air.obj":["../assets/models/air.obj","text/plain; charset=utf-8"],
 "/assets/models/civilian.obj":["../assets/models/civilian.obj","text/plain; charset=utf-8"],
 "/assets/models/defense.obj":["../assets/models/defense.obj","text/plain; charset=utf-8"],
 "/assets/models/tower.obj":["../assets/models/tower.obj","text/plain; charset=utf-8"],
 "/clientRules.js":["../web/clientRules.js","text/javascript; charset=utf-8"],
 "/unitSelection.js":["../web/unitSelection.js","text/javascript; charset=utf-8"],
 "/combatOrders.js":["../web/combatOrders.js","text/javascript; charset=utf-8"],
 "/perfTelemetry.js":["../web/perfTelemetry.js","text/javascript; charset=utf-8"],
 "/streamProtocol.js":["../web/streamProtocol.js","text/javascript; charset=utf-8"]
};
// Expose only explicitly enumerated original art assets; never accept a caller path.
for(const slug of FACTION_SLUGS)for(const role of MODEL_NAMES){
 const route="/assets/models/factions/"+slug+"/"+role+".obj";
 STATIC[route]=["../assets/models/factions/"+slug+"/"+role+".obj",
  "text/plain; charset=utf-8"];
}
for(const slug of FACTION_SLUGS)for(const role of ROSTER_ROLES){
 const name=ROLE_SLUGS[role];
 STATIC["/assets/models/roster/"+slug+"/"+name+".obj"]=[
  "../assets/models/roster/"+slug+"/"+name+".obj","text/plain; charset=utf-8"];
}
STATIC["/skinnedGltf.js"]=["../web/skinnedGltf.js","text/javascript; charset=utf-8"];
STATIC["/vehicleArt.js"]=["../web/vehicleArt.js","text/javascript; charset=utf-8"];
STATIC["/vehicleGltf.js"]=["../web/vehicleGltf.js","text/javascript; charset=utf-8"];
STATIC["/combatVisuals.js"]=["../web/combatVisuals.js","text/javascript; charset=utf-8"];
STATIC["/skinnedRoster.js"]=["../web/skinnedRoster.js","text/javascript; charset=utf-8"];
STATIC["/materialDetail.js"]=["../web/materialDetail.js","text/javascript; charset=utf-8"];
STATIC["/vehicleMotion.js"]=["../web/vehicleMotion.js","text/javascript; charset=utf-8"];
STATIC["/textureShader.js"]=["../web/textureShader.js","text/javascript; charset=utf-8"];
STATIC["/rosterArt.js"]=["../web/rosterArt.js","text/javascript; charset=utf-8"];
STATIC["/rosterLoader.js"]=["../web/rosterLoader.js","text/javascript; charset=utf-8"];
STATIC["/factionArt.js"]=["../web/factionArt.js","text/javascript; charset=utf-8"];
STATIC["/meshAnimation.js"]=["../web/meshAnimation.js","text/javascript; charset=utf-8"];
STATIC["/animationClips.js"]=["../web/animationClips.js","text/javascript; charset=utf-8"];
STATIC["/assets/animations/rig-clips.json"]=[
 "../assets/animations/rig-clips.json","application/json; charset=utf-8"];
STATIC["/factionTextures.js"]=["../web/factionTextures.js","text/javascript; charset=utf-8"];
STATIC["/rigProfiles.js"]=["../web/rigProfiles.js","text/javascript; charset=utf-8"];
STATIC["/assets/rigs/faction-rigs.json"]=["../assets/rigs/faction-rigs.json",
 "application/json; charset=utf-8"];
for(const slug of FACTION_SLUGS){
 STATIC["/assets/textures/factions/"+slug+".ppm"]=[
  "../assets/textures/factions/"+slug+".ppm","text/plain; charset=utf-8"];
}
const HEADERS={"Cache-Control":"no-store","X-Content-Type-Options":"nosniff",
 "Referrer-Policy":"no-referrer",
 "Content-Security-Policy":"default-src 'none'; script-src 'self'; connect-src 'self'; style-src 'unsafe-inline'; img-src 'self' data:; base-uri 'none'; frame-ancestors 'none'"};
function send(res,code,data){
 res.writeHead(code,{"Content-Type":"application/json; charset=utf-8",...HEADERS});
 res.end(JSON.stringify(data));
}
async function readBody(req){
 const parts=[];let total=0;
 for await(const part of req){
  total+=part.length;assert(total<=16000,"Request too large");parts.push(part);
 }
 return JSON.parse(Buffer.concat(parts).toString("utf8")||"{}");
}
/** Build a transport around the existing authoritative host without exporting secrets. */
export function createLoopbackProtocolServer(host){
 const clients=new Set();
 function publish(){
  for(const client of [...clients]){
   if(client.res.destroyed||!host.sessions.has(client.token)){
    client.close();client.res.end();continue;
   }
   if(client.res.writableLength>32768){
    client.close();client.res.destroy();continue;
   }
   if(client.version!==host.version){
    client.version=host.version;
    client.res.write("event: version\ndata: "+JSON.stringify({version:host.version})+"\n\n");
   }
  }
 }
 const server=createServer(async(req,res)=>{
  try{
   const u=new URL(req.url,"http://127.0.0.1"),path=u.pathname;
   const token=req.headers["x-session-token"];
   if(req.method==="GET"&&path.startsWith("/assets/gltf-vehicles/")){
    const slug=path.slice("/assets/gltf-vehicles/".length).split("/")[0];
    const role=VEHICLE_ROLES.find(value=>path===vehicleGltfPath(slug,value));
    if(FACTION_SLUGS.includes(slug)&&role){
     const content=await vehicleAssetFor(slug,role);
     res.writeHead(200,{"Content-Type":"model/gltf+json; charset=utf-8",...HEADERS});
     return res.end(content);
    }
   }
   if(req.method==="GET"&&path.startsWith("/assets/gltf/")){
    const slug=path.slice("/assets/gltf/".length).split("/")[0];
    const role=ALL_SKINNED_ROLES.find(value=>
      path===skinnedGltfPath(slug,value));
    if(FACTION_SLUGS.includes(slug)&&role){
     const content=await gltfForFaction(slug,role);
     res.writeHead(200,{"Content-Type":"model/gltf+json; charset=utf-8",...HEADERS});
     return res.end(content);
    }
   }
   if(req.method==="GET"&&STATIC[path]){
    const [relative,mime]=STATIC[path];
    const bytes=await readFile(new URL(relative,import.meta.url));
    res.writeHead(200,{"Content-Type":mime,...HEADERS});
    return res.end(bytes);
   }
   if(path==="/health"&&req.method==="GET")
    return send(res,200,{status:"ok",prototype:true,transport:"loopback-sse"});
   if(path==="/events"&&req.method==="GET"){
    // Auth uses a request header, never a token in a URL. Stream only versions.
    host.lobbyState(token);
    assert(clients.size<16,"Stream capacity reached");
    res.writeHead(200,{"Content-Type":"text/event-stream; charset=utf-8",
      "Connection":"keep-alive",...HEADERS});
    let timer;
    const client={token,res,version:host.version,close(){
      clients.delete(client);clearInterval(timer);
    }};
    clients.add(client);
    res.write("retry: 1500\nevent: version\ndata: "+
      JSON.stringify({version:host.version})+"\n\n");
    timer=setInterval(()=>{
      if(res.destroyed)client.close();
      else if(res.writableLength>32768){client.close();res.destroy();}
      else res.write(": heartbeat\n\n");
    },15000);
    res.on("close",client.close);
    return;
   }
   if(path==="/state"&&req.method==="GET")return send(res,200,host.view(token));
   if(path==="/catalog"&&req.method==="GET")return send(res,200,host.catalog(token));
   if(path==="/lobby"&&req.method==="GET")return send(res,200,host.lobbyState(token));
   if(path==="/resync"&&req.method==="GET")
    return send(res,200,host.resync({token,
      afterVersion:Number(u.searchParams.get("afterVersion")??0)}));
   if(path==="/command"&&req.method==="POST"){
    const input=await readBody(req),result=host.submit({token,...input});
    publish();return send(res,200,result);
   }
   if(path==="/command-batch"&&req.method==="POST"){
    const input=await readBody(req),result=host.submitBatch({token,...input});
    publish();return send(res,200,result);
   }
   if(path==="/lobby/ready"&&req.method==="POST"){
    const input=await readBody(req),result=host.setReady(token,input.ready);
    publish();return send(res,200,result);
   }
   if(path==="/lobby/start"&&req.method==="POST"){
    await readBody(req);const result=host.startMatch(token);
    publish();return send(res,200,result);
   }
   if(path==="/session/rotate"&&req.method==="POST"){
    await readBody(req);const result=host.rotateToken(token);
    publish();return send(res,200,result);
   }
   return send(res,404,{error:"Unknown endpoint"});
  }catch(e){
   const status=/Unauthorized session/.test(e.message)?401:
     /Stream capacity/.test(e.message)?429:400;
   if(!res.headersSent)send(res,status,{error:e.message});
   else res.end();
  }
 });
 server.on("close",()=>{
  for(const c of [...clients]){c.close();c.res.end();}
 });
 return {server,publish,subscriberCount:()=>clients.size};
}
