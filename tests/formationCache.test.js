import test from "node:test";
import assert from "node:assert/strict";
import {createMatch,command,step} from "../src/simulation.js";
import {makeMap} from "../src/map.js";
import {attachBattlefield} from "../src/battlefield.js";
import {enableUnitCollision,validateCollisionState} from "../src/unitCollision.js";
import {makeUnit} from "../src/state.js";
import {ARCHETYPES} from "../src/catalog.js";
import {planFormation} from "../src/groupNavigation.js";
function fixture(){
 const m=createMatch([{id:"a",faction:"Humans"},{id:"b",faction:"Orcs"}],281);
 const map=makeMap({width:48,height:48,seed:281,players:2});
 for(const t of map.tiles){t.terrain="grass";t.resource=null;t.occupied=null;}
 attachBattlefield(m,map);enableUnitCollision(m);
 const p=m.players[0],units=[];
 for(let i=0;i<24;i++){
  const u=makeUnit(p,"Swordsman",ARCHETYPES.Swordsman,"army-"+String(i).padStart(2,"0"));
  u.x=10+i%6;u.y=12+Math.floor(i/6);p.units.push(u);p.popUsed+=u.pop;units.push(u);
 }
 return {m,p,units};
}
test("24-unit formation checks terrain only once per archetype and has unique targets",()=>{
 const {m,units}=fixture(),diagnostics={};
 const plan=planFormation(m,"a",units,30,30,{diagnostics});
 assert.equal(plan.length,24);
 assert.equal(new Set(plan.map(p=>p.destination.x+","+p.destination.y)).size,24);
 assert.equal(diagnostics.passabilityIndexes,1);
 assert.equal(diagnostics.terrainChecks,m.battlefield.tiles.length);
 assert.ok(diagnostics.routeExpansions<=24*m.battlefield.tiles.length);
 assert.deepEqual(planFormation(m,"a",[...units].reverse(),30,30)
  .map(p=>[p.unitId,p.destination]).sort((a,b)=>a[0].localeCompare(b[0])),
  plan.map(p=>[p.unitId,p.destination]).sort((a,b)=>a[0].localeCompare(b[0])));
 const result=command(m,{player:"a",action:"formation",units:units.map(u=>u.id),x:30,y:30});
 assert.equal(result.length,24);
 step(m,5000);
 assert.deepEqual(validateCollisionState(m).overlaps,[]);
});
test("unreachable target area leaves prior formation orders intact",()=>{
 const {m,units}=fixture(),prior=structuredClone(m.orders);
 for(let y=27;y<34;y++)for(let x=27;x<34;x++)
  m.battlefield.tiles[y*48+x].terrain="water";
 assert.throws(()=>planFormation(m,"a",units,30,30),/reachable/);
 assert.deepEqual(m.orders,prior);
});
