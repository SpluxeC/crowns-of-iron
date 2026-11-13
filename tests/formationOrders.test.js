import test from "node:test";
import assert from "node:assert/strict";
import {createMatch,command,step} from "../src/simulation.js";
import {attachBattlefield} from "../src/battlefield.js";
import {makeMap,placeBuilding} from "../src/map.js";
import {makeUnit} from "../src/state.js";
import {ARCHETYPES} from "../src/catalog.js";
function fixture(){
 const m=createMatch([{id:"a",faction:"Humans"},{id:"b",faction:"Orcs"}],19);
 const map=makeMap({seed:19,players:2});
 for(const t of map.tiles){t.terrain="grass";t.occupied=null;t.resource=null;}
 attachBattlefield(m,map);
 const p=m.players[0],e=m.players[1];
 for(let i=0;i<3;i++){const u=makeUnit(p,"Swordsman",ARCHETYPES.Swordsman,"formation-"+i);
  u.x=9;u.y=9+i;p.units.push(u);p.popUsed+=u.pop;}
 return {m,p,e,map};
}
test("formation gives unique reachable destinations to an owned group",()=>{
 const {m}=fixture();
 const results=command(m,{player:"a",action:"formation",units:["formation-0","formation-1","formation-2"],x:20,y:20});
 assert.equal(results.length,3);
 assert.equal(new Set(results.map(r=>r.destination.x+","+r.destination.y)).size,3);
 step(m,1000);
 assert.ok(m.players[0].units.find(u=>u.id==="formation-0").x>9);
});
test("formation rejection is atomic for ownership mistakes",()=>{
 const {m}=fixture(),before=structuredClone(m.orders);
 assert.throws(()=>command(m,{player:"a",action:"formation",
 units:["formation-0",m.players[1].units[0].id],x:20,y:20}),/owned/);
 assert.deepEqual(m.orders,before);
});
test("siege order approaches from afar, respects cooldown and damages enemy structure",()=>{
 const {m,map,p}=fixture();
 const structure=placeBuilding(map,{owner:"b",kind:"Shelter",x:22,y:20,width:2,height:2});
 m.constructions={[structure.id]:{siteId:structure.id,owner:"b",kind:"Shelter",completed:true,
 hp:500,maxHp:500,armor:2,cost:{Wood:60}}};
 const gun=makeUnit(p,"Heavy Artillery",ARCHETYPES["Heavy Artillery"],"gun");
 gun.x=12;gun.y=20;p.units.push(gun);p.popUsed+=gun.pop;
 const result=command(m,{player:"a",action:"siege",unitId:"gun",siteId:structure.id});
 assert.ok(result.steps>0);
 const before=m.constructions[structure.id].hp;
 step(m,10000);
 assert.ok(m.constructions[structure.id].hp<before);
});
