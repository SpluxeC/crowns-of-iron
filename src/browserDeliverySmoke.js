import {readFile} from "node:fs/promises";
import {MatchHost} from "./network.js";
import {createLoopbackProtocolServer} from "./loopbackProtocol.js";
import {assert} from "./util.js";
import {MODEL_NAMES,parseMtl,parseObj} from "../web/objLoader.js";
import {FACTION_SLUGS,factionMeshPath} from "../web/factionArt.js";
import {parsePpm} from "../web/factionTextures.js";

/** Real localhost HTTP delivery/interaction contract, not a graphical browser runner. */
export async function runBrowserDeliverySmoke(){
 const host=new MatchHost([{id:"a",faction:"Humans"},{id:"b",faction:"Orcs"}],712);
 const {server}=createLoopbackProtocolServer(host);
 await new Promise(resolve=>server.listen(0,"127.0.0.1",resolve));
 const base="http://127.0.0.1:"+server.address().port;
 const token=host.credentialsFor("a").token;
 const requiredIds=["view","select","move","formation","attack","attackMove","stop",
  "stance","stanceChoice","map","map3d","groups","perf","connect","research",
  "trainWorker","build","researchChoice","trainChoice","buildChoice"];
 const requiredScripts=["/netplay.js","/webgl3d.js","/assetManifest.js",
  "/clientRules.js","/unitSelection.js","/combatOrders.js",
  "/perfTelemetry.js","/streamProtocol.js","/objLoader.js","/modelGallery.js",
  "/factionArt.js","/meshAnimation.js","/factionTextures.js"];
 let checked=0;
 try{
  const client=await fetch(base+"/client");
  assert(client.status===200,"Browser client HTML unavailable");
  const html=await client.text();
  for(const id of requiredIds){
   assert(new RegExp('id="'+id+'"').test(html),"Missing browser control "+id);
   checked++;
  }
  assert(html.includes('src="/netplay.js"'),"Client entrypoint missing");
  assert(client.headers.get("content-security-policy")?.includes("script-src 'self'"),
   "CSP missing");
  const available=new Set(requiredScripts);
  for(const script of requiredScripts){
   const res=await fetch(base+script);
   assert(res.status===200,"Browser module unavailable: "+script);
   assert(/javascript/.test(res.headers.get("content-type")??""),
    "Browser module content-type incorrect: "+script);
   const source=await res.text();
   for(const [,relative] of source.matchAll(/\bfrom\s+["'](\/[^"']+|\.\/[^"']+)["']/g)){
    const resolved=relative.startsWith("/")?relative:"/"+relative.slice(2);
    assert(available.has(resolved),"Unserved browser import "+resolved+" in "+script);
   }
   checked++;
  }
  const gallery=await fetch(base+"/model-gallery");
  assert(gallery.status===200,"Model gallery page unavailable");
  const galleryHtml=await gallery.text();
  assert(galleryHtml.includes('src="/modelGallery.js"'),"Model gallery entrypoint missing");
  for(const name of MODEL_NAMES)assert(galleryHtml.includes('value="'+name+'"'),
   "Model gallery option missing: "+name);
  const mtlResponse=await fetch(base+"/assets/models/crowns-palette.mtl");
  assert(mtlResponse.status===200,"OBJ material palette not served");
  const materials=parseMtl(await mtlResponse.text());
  let assetTriangles=0;
  for(const name of MODEL_NAMES){
   const res=await fetch(base+"/assets/models/"+name+".obj");
   assert(res.status===200,"OBJ mesh missing: "+name);
   assert(res.headers.get("content-type")?.includes("text/plain"),"OBJ MIME incorrect");
   assetTriangles+=parseObj(await res.text(),materials).triangles;
  }
  let factionMeshes=0,factionTriangles=0;
  for(const faction of FACTION_SLUGS)for(const name of MODEL_NAMES){
   const res=await fetch(base+factionMeshPath(faction,name));
   assert(res.status===200,"Faction model unavailable: "+faction+"/"+name);
   const mesh=parseObj(await res.text(),materials);
   assert(mesh.triangles>25,"Invalid faction model geometry");
   factionTriangles+=mesh.triangles;factionMeshes++;
  }
  let factionTextures=0;
  for(const faction of FACTION_SLUGS){
   const res=await fetch(base+"/assets/textures/factions/"+faction+".ppm");
   assert(res.status===200,"Faction surface pattern unavailable: "+faction);
   const image=parsePpm(await res.text());
   assert(image.width===32&&image.height===32,"Faction pattern size changed");
   factionTextures++;
  }
  const forbidden=await fetch(base+"/assets/models/factions/not-a-faction/worker.obj");
  assert(forbidden.status===404,"Unknown faction asset path accepted");
  const illegal=await fetch(base+"/assets/models/unknown.obj");
  assert(illegal.status===404,"Unlisted model path unexpectedly served");
  const absent=await fetch(base+"/state");
  assert(absent.status===401,"Anonymous snapshot unexpectedly accepted");
  const headers={"x-session-token":token};
  const stateRes=await fetch(base+"/state",{headers});
  assert(stateRes.status===200);
  const state=await stateRes.json();
  assert(state.playerId==="a"&&state.nextSequence===1,"Client initial state invalid");
  assert(!state.state.players.find(p=>p.id==="b").resources,
   "Opponent private economy leaked");
  const unit=host.match.players[0].units.find(u=>u.alive&&u.attack>0);
  const post=await fetch(base+"/command-batch",{method:"POST",
   headers:{...headers,"Content-Type":"application/json"},
   body:JSON.stringify({expectedVersion:state.version,orders:[{sequence:1,
    action:"stance",payload:{unitId:unit.id,stance:"aggressive"}}]})});
  assert(post.status===200,await post.text());
  const next=await (await fetch(base+"/state",{headers})).json();
  assert(next.nextSequence===2,"Successful stance batch failed to advance sequence");
  assert(host.match.players[0].units.find(u=>u.id===unit.id).combatStance==="aggressive");
  return {htmlControls:requiredIds.length,servedModules:requiredScripts.length,
   servedMeshes:MODEL_NAMES.length,assetTriangles,factionMeshes,factionTriangles,
   factionTextures,
   contractsChecked:checked,anonymousRejected:true,authenticatedBatch:true,
   scope:"localhost HTTP delivery and server interaction; NOT real browser GPU/DOM automation"};
 }finally{
  server.closeAllConnections();
  await new Promise(resolve=>server.close(resolve));
 }
}
