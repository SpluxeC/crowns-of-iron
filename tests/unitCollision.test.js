import test from "node:test";
import assert from "node:assert/strict";
import {createMatch,command,step} from "../src/simulation.js";
import {makeMap} from "../src/map.js";
import {attachBattlefield} from "../src/battlefield.js";
import {enableUnitCollision,validateCollisionState} from "../src/unitCollision.js";
function fixture(){
 const m=createMatch([{id:"a",faction:"Humans"},{id:"b",faction:"Orcs"}],18);
 const map=makeMap({seed:18,players:2});
 for(const t of map.tiles){t.terrain="grass";t.occupied=null;t.resource=null;}
 attachBattlefield(m,map);return m;
}
test("collision mode separates initially stacked workers deterministically",()=>{
 const a=fixture(),b=fixture();
 enableUnitCollision(a);enableUnitCollision(b);
 assert.equal(validateCollisionState(a).overlaps.length,0);
 assert.deepEqual(a.players.map(p=>p.units.map(u=>[u.x,u.y])),
  b.players.map(p=>p.units.map(u=>[u.x,u.y])));
});
test("two ground units cannot end movement on the same reserved tile",()=>{
 const m=fixture();enableUnitCollision(m);
 const p=m.players[0],a=p.units[0],b=p.units[1];
 const goal={x:Math.floor(m.battlefield.width/2),y:Math.floor(m.battlefield.height/2)};
 command(m,{player:"a",action:"move",unitId:a.id,...goal});
 command(m,{player:"a",action:"move",unitId:b.id,...goal});
 step(m,30000);
 assert.notDeepEqual([a.x,a.y],[b.x,b.y]);
 assert.deepEqual(validateCollisionState(m).overlaps,[]);
});
test("collision setting cannot be changed after simulation time advances",()=>{
 const m=fixture();step(m,1000);
 assert.throws(()=>enableUnitCollision(m),/before simulation/);
});
