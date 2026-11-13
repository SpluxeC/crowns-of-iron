import test from "node:test";
import assert from "node:assert/strict";
import {createMatch,command,step} from "../src/simulation.js";
import {makeMap,canPlace} from "../src/map.js";
import {attachBattlefield} from "../src/battlefield.js";
import {makeUnit} from "../src/state.js";
import {ARCHETYPES} from "../src/catalog.js";

function fixture(){
 const m=createMatch([{id:"a",faction:"Humans"},{id:"b",faction:"Orcs"}],19);
 const map=makeMap({seed:19,players:2});attachBattlefield(m,map);
 const attacker=m.players[0],defender=m.players[1];defender.resources.Wood=1000;
 const s=map.starts[1],worker=defender.units[0];
 let pos=null;
 for(let y=0;y<map.height-2&&!pos;y++)for(let x=0;x<map.width-2;x++){
   if(canPlace(map,x,y,2,2)&&Math.abs(x-s.x)+Math.abs(y-s.y)<9){pos={x,y};break;}
 }
 assert.ok(pos);
 const siteId=command(m,{player:"b",action:"build",kind:"Shelter",...pos,workers:[worker.id]});
 step(m,24000);
 const site=m.constructions[siteId];
 assert.ok(site.completed);
 const soldier=makeUnit(attacker,"Heavy Artillery",ARCHETYPES["Heavy Artillery"],"siege-test");
 soldier.x=pos.x-1;soldier.y=pos.y;attacker.units.push(soldier);attacker.popUsed+=soldier.pop;
 return {m,attacker,defender,soldier,worker,site,siteId,pos};
}
test("ranged structure attacks use Armor and inflict damage on a real site",()=>{
 const {m,site,siteId,soldier}=fixture();
 const before=site.hp;
 command(m,{player:"a",action:"attackStructure",unitId:soldier.id,siteId});
 step(m,1000);
 assert.ok(site.hp<before);
 assert.equal(site.maxHp,450);
});
test("a building cannot be attacked at unlimited range or by an allied unit",()=>{
 const {m,siteId,soldier}=fixture();
 soldier.x=1;soldier.y=1;
 assert.throws(()=>command(m,{player:"a",action:"attackStructure",unitId:soldier.id,siteId}),/out of weapon range/);
 assert.throws(()=>command(m,{player:"b",action:"attackStructure",unitId:m.players[1].units[1].id,siteId}),/friendly/);
});
test("owned adjacent worker can repair structure and consumes repair materials",()=>{
 const {m,defender,worker,site,siteId,pos}=fixture();
 site.hp-=90;worker.x=pos.x-1;worker.y=pos.y;
 const woodBefore=defender.resources.Wood;
 const restored=command(m,{player:"b",action:"repairBuilding",siteId,workers:[worker.id],amount:100});
 assert.equal(restored.restored,40);
 assert.ok(defender.resources.Wood<woodBefore);
 assert.equal(site.hp,400);
 assert.throws(()=>command(m,{player:"b",action:"repairBuilding",siteId,workers:[worker.id],amount:20}),/cooldown/);
 const previousHp=site.hp;step(m,4000);assert.equal(site.hp,previousHp);
});
test("destroyed structure automatically becomes a time-limited ruin",()=>{
 const {m,soldier,site,siteId}=fixture();
 soldier.attack=5000;
 command(m,{player:"a",action:"attackStructure",unitId:soldier.id,siteId});
 step(m,1000);
 assert.equal(m.constructions[siteId],undefined);
 assert.ok(m.ruins[siteId]);
});
