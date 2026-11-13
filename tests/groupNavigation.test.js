import test from "node:test";
import assert from "node:assert/strict";
import {createMatch,command,step} from "../src/simulation.js";
import {makeMap} from "../src/map.js";
import {attachBattlefield} from "../src/battlefield.js";
import {enableUnitCollision,validateCollisionState} from "../src/unitCollision.js";
import {makeUnit} from "../src/state.js";
import {ARCHETYPES} from "../src/catalog.js";
function fixture(){
 const m=createMatch([{id:"a",faction:"Humans"},{id:"b",faction:"Orcs"}],42),
 map=makeMap({players:2,seed:42});
 for(const t of map.tiles){t.terrain="grass";t.resource=null;t.occupied=null;}
 attachBattlefield(m,map);enableUnitCollision(m);
 const p=m.players[0];let i=0;
 for(const [x,y] of [[8,12],[10,12],[8,14],[10,14]]){
  const u=makeUnit(p,"Swordsman",ARCHETYPES.Swordsman,"group-"+i++);
  u.x=x;u.y=y;p.units.push(u);p.popUsed+=u.pop;
 }
 return m;
}
test("formation selects unique reachable goals while avoiding stationary blockers",()=>{
 const m=fixture(),u=m.players[0].units.filter(u=>u.id.startsWith("group-"));
 const blocker=m.players[0].units[0];blocker.x=20;blocker.y=20;
 const plans=command(m,{player:"a",action:"formation",units:u.map(v=>v.id),x:20,y:20});
 assert.equal(plans.length,4);
 assert.equal(new Set(plans.map(p=>p.destination.x+","+p.destination.y)).size,4);
 assert.ok(plans.every(p=>p.destination.x!==20||p.destination.y!==20));
 step(m,30000);
 assert.deepEqual(validateCollisionState(m).overlaps,[]);
});
test("formation assignment independent of input ordering, deterministic and atomic",()=>{
 const a=fixture(),b=fixture();
 const ids=a.players[0].units.filter(u=>u.id.startsWith("group-")).map(u=>u.id);
 const plansA=command(a,{player:"a",action:"formation",units:ids,x:20,y:20});
 const plansB=command(b,{player:"a",action:"formation",units:[...ids].reverse(),x:20,y:20});
 const byId=x=>x.map(({unitId,destination})=>[unitId,destination])
   .sort((a,b)=>a[0].localeCompare(b[0]));
 assert.deepEqual(byId(plansA),byId(plansB));
 step(a,20000);step(b,20000);
 assert.deepEqual(a.players.map(p=>p.units.map(u=>[u.id,u.x,u.y])),
  b.players.map(p=>p.units.map(u=>[u.id,u.x,u.y])));
 assert.deepEqual(a.orders,b.orders);
});
test("unreachable formation rejects without changing any unit orders",()=>{
 const m=fixture(),ids=m.players[0].units.filter(u=>u.id.startsWith("group-")).map(u=>u.id);
 const before=structuredClone(m.orders);
 assert.throws(()=>command(m,{player:"a",action:"formation",units:ids,x:-90,y:-90}),
  /reachable/);
 assert.deepEqual(m.orders,before);
});
