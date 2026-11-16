import test from "node:test";
import assert from "node:assert/strict";
import {createMatch,command,step} from "../src/simulation.js";
import {makeMap} from "../src/map.js";
import {attachBattlefield} from "../src/battlefield.js";
import {issuePatrol,tickPatrolRoutes} from "../src/patrolOrders.js";
function scene(){
 const match=createMatch([{id:"human",faction:"Humans"},
  {id:"ai-1",faction:"Orcs"}],712);
 const map=makeMap({seed:712,players:2,width:48,height:48});
 attachBattlefield(match,map);
 return match;
}
test("patrol starts with attack-move and retains two fixed endpoints",()=>{
 const match=scene(),unit=match.players[0].units.find(u=>u.alive&&u.attack>0);
 assert.ok(unit,"Expected an armed starter unit");
 const candidate=match.battlefield.tiles.find(t=>t.x===unit.x+1&&t.y===unit.y&&
  t.terrain==="grass"&&t.occupied===null)??match.battlefield.tiles.find(t=>
  t.x===unit.x&&t.y===unit.y+1&&t.terrain==="grass"&&t.occupied===null);
 assert.ok(candidate);
 const result=command(match,{player:"human",action:"patrol",unitId:unit.id,
  x:candidate.x,y:candidate.y});
 assert.equal(result.unitId,unit.id);
 assert.deepEqual(match.patrolRoutes[unit.id].home,{x:unit.x,y:unit.y});
 assert.equal(match.orders[unit.id].kind,"attackMove");
});
test("explicit stop command cancels active patrol route",()=>{
 const match=scene(),unit=match.players[0].units.find(u=>u.alive&&u.attack>0);
 const destination=match.battlefield.tiles.find(t=>t.terrain==="grass"&&
  t.x===unit.x+1&&t.y===unit.y);
 assert.ok(destination);
 command(match,{player:"human",action:"patrol",unitId:unit.id,
  x:destination.x,y:destination.y});
 command(match,{player:"human",action:"stop",unitId:unit.id});
 assert.equal(match.patrolRoutes[unit.id],undefined);
 assert.equal(match.orders[unit.id],undefined);
});
test("patrol tick schedules reverse path after first endpoint is reached",()=>{
 const match=scene(),unit=match.players[0].units.find(u=>u.alive&&u.attack>0);
 const destination=match.battlefield.tiles.find(t=>t.terrain==="grass"&&
  t.x===unit.x+1&&t.y===unit.y);
 assert.ok(destination);
 command(match,{player:"human",action:"patrol",unitId:unit.id,
  x:destination.x,y:destination.y});
 // Simulate completion of the already-validated forward leg.
 unit.x=destination.x;unit.y=destination.y;delete match.orders[unit.id];
 tickPatrolRoutes(match);
 assert.equal(match.orders[unit.id].kind,"attackMove");
 assert.deepEqual(match.orders[unit.id].destination,match.patrolRoutes[unit.id].home);
});
