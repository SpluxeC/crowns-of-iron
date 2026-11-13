import test from "node:test";
import assert from "node:assert/strict";
import {createMatch,command,step,checksum} from "../src/simulation.js";
import {makeMap} from "../src/map.js";
import {attachBattlefield} from "../src/battlefield.js";
import {enableUnitCollision,validateCollisionState} from "../src/unitCollision.js";
function setup(){
 const m=createMatch([{id:"a",faction:"Humans"},{id:"b",faction:"Orcs"}],73);
 const map=makeMap({players:2,seed:73});
 for(const t of map.tiles){t.terrain="grass";t.occupied=null;t.resource=null;}
 attachBattlefield(m,map);
 enableUnitCollision(m);
 const [mover,blocker]=m.players[0].units;
 mover.x=5;mover.y=5;blocker.x=6;blocker.y=5;
 return {m,mover,blocker};
}
test("collision-aware movement deterministically routes around a stationary occupied tile",()=>{
 const a=setup(),b=setup();
 for(const f of [a,b]){
  command(f.m,{player:"a",action:"move",unitId:f.mover.id,x:8,y:5});
  step(f.m,30000);
  assert.deepEqual([f.mover.x,f.mover.y],[8,5]);
  assert.deepEqual(validateCollisionState(f.m).overlaps,[]);
 }
 assert.equal(checksum(a.m),checksum(b.m));
});
test("occupied destination remains pending and completes after blocker vacates",()=>{
 const {m,mover,blocker}=setup();
 command(m,{player:"a",action:"move",unitId:mover.id,x:6,y:5});
 step(m,5000);
 assert.ok(m.orders[mover.id]);
 assert.notDeepEqual([mover.x,mover.y],[6,5]);
 command(m,{player:"a",action:"move",unitId:blocker.id,x:6,y:6});
 step(m,10000);
 assert.deepEqual([mover.x,mover.y],[6,5]);
 assert.deepEqual(validateCollisionState(m).overlaps,[]);
});
