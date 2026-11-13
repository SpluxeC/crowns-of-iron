import {createMatch,command,step} from "../src/simulation.js";
import {makeMap} from "../src/map.js";
import {attachBattlefield} from "../src/battlefield.js";
import {enableUnitCollision,validateCollisionState} from "../src/unitCollision.js";
import {cameraForMap,projectWorld,raycastTerrain,unitVisual} from "../web/webgl3d.js";
import {MatchHost} from "../src/network.js";
import {createLoopbackProtocolServer} from "../src/loopbackProtocol.js";
import {assert} from "../src/util.js";

const players=[{id:"a",faction:"Humans"},{id:"b",faction:"Orcs"}];
const m=createMatch(players,51),map=makeMap({width:40,height:32,seed:51,players:2});
for(const t of map.tiles){t.terrain="grass";t.occupied=null;t.resource=null;}
attachBattlefield(m,map);enableUnitCollision(m);
const ids=m.players[0].units.slice(0,3).map(u=>u.id);
const assignments=command(m,{player:"a",action:"formation",units:ids,x:20,y:16});
assert(assignments.length===3&&new Set(assignments.map(p=>p.destination.x+","+p.destination.y)).size===3,
 "Formation assignment failed");
step(m,1000);
assert(validateCollisionState(m).overlaps.length===0,"Collision detected");
const cam=cameraForMap(40,32),center=projectWorld({x:20.5,y:.12,z:16.5},800,640,cam);
const picked=raycastTerrain(cam,center.x,center.y,800,640,map);
assert(picked?.x===20&&picked?.y===16,"WebGL picking failed");
assert(unitVisual({archetype:"Scout Aircraft"}).offset>1,"Aerial proxy invalid");
const host=new MatchHost(players,92,{requireReady:true});
const network=createLoopbackProtocolServer(host);
await new Promise(resolve=>network.server.listen(0,"127.0.0.1",resolve));
try{
 const base="http://127.0.0.1:"+network.server.address().port;
 const response=await fetch(base+"/state",{headers:{
  "x-session-token":host.credentialsFor("a").token}});
 assert(response.status===200,"Local HTTP host unavailable");
 const view=await response.json();
 assert(view.playerId==="a"&&view.nextSequence===1,"Client authentication failed");
 console.log(JSON.stringify({phase:"5.1–5.4",formations:assignments.length,
  collisions:0,rayPick:picked,localHttp:response.status,
  clientEndpoint:base+"/client",actualBrowserVisualQA:"manual"},null,2));
}finally{
 network.server.closeAllConnections();
 await new Promise(resolve=>network.server.close(resolve));
}
