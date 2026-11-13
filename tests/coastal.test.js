import test from "node:test";
import assert from "node:assert/strict";
import {makeCoastalMap,verifySeaConnectivity,validCoastalPlacement} from "../src/coastal.js";
import {createMatch,command,step} from "../src/simulation.js";
import {attachBattlefield} from "../src/battlefield.js";
import {pathForUnit} from "../src/movementDomains.js";
import {at} from "../src/map.js";

test("seeded maps have one connected perimeter sea and symmetric coastal pads",()=>{
 for(const players of [2,4,6,8]){
  const map=makeCoastalMap({seed:74,width:64,height:64,players});
  const connection=verifySeaConnectivity(map);
  assert.equal(connection.connected,true,JSON.stringify({players,connection}));
  assert.ok(connection.total>240);
  assert.equal(map.coastalPads.length,players);
  for(const pad of map.coastalPads){
   assert.ok(validCoastalPlacement(map,pad.x,pad.y,5,4)||
     validCoastalPlacement(map,pad.x,pad.y,4,5),"No Dock-size shoreline pad");
  }
 }
});
test("coastal generation is reproducible, old maps stay unchanged",()=>{
 const a=makeCoastalMap({seed:13,players:2});
 const b=makeCoastalMap({seed:13,players:2});
 assert.deepEqual(a,b);
 assert.equal(at(a,0,0).terrain,"water");
});
test("Dock requires dry shoreline and a real water launch route",()=>{
 const map=makeCoastalMap({seed:44,players:2}),m=createMatch([
  {id:"a",faction:"Humans"},{id:"b",faction:"Orcs"}],44);
 attachBattlefield(m,map);const p=m.players[0],pad=map.coastalPads[0];
 p.age="II";p.resources.Wood=1000;
 const w=p.units[0];
 const siteId=command(m,{player:"a",action:"build",kind:"Dock",
  x:pad.x,y:pad.y,workers:[w.id]});
 assert.ok(m.constructions[siteId]);
 step(m,60000);
 assert.equal(m.constructions[siteId].completed,true);
 assert.throws(()=>command(m,{player:"a",action:"build",kind:"Dock",
   x:map.starts[0].x-2,y:map.starts[0].y-2,workers:[w.id]}),
   /placement|Coastal/);
 const launch=at(map,0,0);
 assert.equal(launch.terrain,"water");
 const sea=map.tiles.find(t=>t.terrain==="water"&&t.y===map.height-1);
 assert.ok(pathForUnit(m,"a","Raft",{x:0,y:0},{x:sea.x,y:sea.y}));
});
