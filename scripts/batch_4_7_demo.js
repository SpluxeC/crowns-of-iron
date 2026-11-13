import {createMatch,command,step} from "../src/simulation.js";
import {makeMap} from "../src/map.js";
import {attachBattlefield} from "../src/battlefield.js";
import {enableUnitCollision,validateCollisionState} from "../src/unitCollision.js";
import {MatchHost} from "../src/network.js";
import {cameraForMap,projectWorld} from "../web/webgl3d.js";
import {assert} from "../src/util.js";
const people=[{id:"a",faction:"Humans"},{id:"b",faction:"Orcs"}];
const match=createMatch(people,52),map=makeMap({players:2,seed:52});
for(const t of map.tiles){t.terrain="grass";t.occupied=null;t.resource=null;}
attachBattlefield(match,map);enableUnitCollision(match);
const [mover,blocker]=match.players[0].units;
mover.x=5;mover.y=5;blocker.x=6;blocker.y=5;
command(match,{player:"a",action:"move",unitId:mover.id,x:8,y:5});
step(match,30000);
assert(mover.x===8&&mover.y===5,"Congestion detour failed");
assert(validateCollisionState(match).overlaps.length===0,"Units overlap");
const host=new MatchHost(people,52,{requireReady:true});
const a=host.credentialsFor("a").token,b=host.credentialsFor("b").token;
host.setReady(a,true);host.setReady(b,true);host.startMatch(a);
host.submit({token:a,sequence:1,action:"allocate",payload:{workers:{Food:3}}});
host.advance(1000);
const resumed=MatchHost.fromCheckpoint(host.checkpoint());
assert(resumed.version===host.version&&resumed.match.tick===host.match.tick,
 "Checkpoint round-trip failed");
assert(resumed.credentialsFor("a").token!==a,"Restored token was reused");
const projected=projectWorld({x:20,y:0,z:16},800,640,cameraForMap(40,32));
assert(projected.x>0&&projected.y>0&&projected.x<800&&projected.y<640,
 "Camera projection out of viewport");
console.log(JSON.stringify({batch:"4.7–5.0",detours:true,webglCameraMath:true,
 lobby:true,checkpoint:true,browserVisualQA:"required"},null,2));
