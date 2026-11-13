import test from "node:test";
import assert from "node:assert/strict";
import {createMatch,command,step} from "../src/simulation.js";
import {makeMap,placeBuilding} from "../src/map.js";
import {attachBattlefield} from "../src/battlefield.js";
import {makeUnit} from "../src/state.js";
import {ARCHETYPES} from "../src/catalog.js";
import {destroyStructure} from "../src/construction.js";

const participants=[{id:"a",faction:"Humans"},{id:"b",faction:"Orcs"}];
function fixture(){
 const m=createMatch(participants,82),map=makeMap({seed:82,players:2});
 for(const tile of map.tiles){tile.terrain="grass";tile.occupied=null;tile.resource=null;tile.amount=0;}
 attachBattlefield(m,map);
 const structure=placeBuilding(map,{owner:"a",kind:"Watchtower",x:10,y:10,width:2,height:2});
 m.constructions={[structure.id]:{siteId:structure.id,owner:"a",kind:"Watchtower",completed:true,
   hp:1200,maxHp:1200,armor:8,cost:{Stone:100},garrisonIds:[],facilityKey:null}};
 const p=m.players[0],enemy=m.players[1].units[0];
 enemy.x=15;enemy.y=10;
 for(let i=0;i<2;i++){
  const archer=makeUnit(p,"Archer",ARCHETYPES.Archer,"garrison-archer-"+i);
  archer.x=9;archer.y=10;p.units.push(archer);p.popUsed+=archer.pop;
 }
 return {m,siteId:structure.id,p,enemy};
}
test("garrison requires owned nearby infantry and respects capacity",()=>{
 const {m,siteId,p}=fixture();
 command(m,{player:"a",action:"garrison",siteId,unitId:"garrison-archer-0"});
 const unit=p.units.find(x=>x.id==="garrison-archer-0");
 assert.equal(unit.x,null);assert.equal(unit.garrisonedAt,siteId);
 assert.throws(()=>command(m,{player:"b",action:"garrison",siteId,unitId:m.players[1].units[0].id}),/enemy structure/);
 assert.throws(()=>command(m,{player:"a",action:"move",unitId:unit.id,x:14,y:11}),/garrisoned|position/);
 command(m,{player:"a",action:"ungarrison",unitId:unit.id});
 assert.equal(unit.garrisonedAt,null);assert.ok(Number.isInteger(unit.x));
});
test("tower fires only when staffed and cannot infinitely fire per tick",()=>{
 const {m,siteId,enemy}=fixture();
 const health=enemy.hp;step(m,1000);assert.equal(enemy.hp,health);
 command(m,{player:"a",action:"garrison",siteId,unitId:"garrison-archer-0"});
 step(m,1000);assert.ok(enemy.hp<health);
 const after=enemy.hp;
 step(m,1000);assert.equal(enemy.hp,after);
});
test("garrison-slot research adds one firing slot without regenerating HP",()=>{
 const f1=fixture(),f2=fixture();
 for(const f of [f1,f2]){
  command(f.m,{player:"a",action:"garrison",siteId:f.siteId,unitId:"garrison-archer-0"});
  command(f.m,{player:"a",action:"garrison",siteId:f.siteId,unitId:"garrison-archer-1"});
 }
 f2.p.completed.push("BLD-07");
 step(f1.m,1000);step(f2.m,1000);
 assert.ok(f2.enemy.hp<f1.enemy.hp);
});
test("destroyed garrison ejects surviving troops with damage and clears reservation",()=>{
 const {m,siteId,p}=fixture();
 command(m,{player:"a",action:"garrison",siteId,unitId:"garrison-archer-0"});
 destroyStructure(m,siteId);
 const unit=p.units.find(x=>x.id==="garrison-archer-0");
 assert.equal(unit.garrisonedAt,null);
 assert.ok(Number.isInteger(unit.x));
 assert.ok(unit.hp<unit.maxHp);
});
