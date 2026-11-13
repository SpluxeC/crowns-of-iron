import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createMatch,command,step} from "../src/simulation.js";
import {attachBattlefield} from "../src/battlefield.js";
import {makeMap,at,placeBuilding} from "../src/map.js";
import {makeUnit} from "../src/state.js";
import {ARCHETYPES} from "../src/catalog.js";
import {strike} from "../src/combat.js";
import {executableCoverage} from "../src/technologyEffects.js";
const data=JSON.parse(readFileSync("data/balance-v0.2.json","utf8"));
function setup(){
 const m=createMatch([{id:"a",faction:"Humans"},{id:"b",faction:"Orcs"}],88);
 const map=makeMap({seed:88,players:2});
 for(const t of map.tiles){t.terrain="grass";t.occupied=null;t.resource=null;t.amount=0;}
 attachBattlefield(m,map);
 return {m,map,p:m.players[0],enemy:m.players[1]};
}
test("all optional research effects now have executable handlers",()=>{
 const ids=data.research.rows.filter(r=>r[0]==="Humans").map(r=>r[1]);
 assert.deepEqual(executableCoverage(ids),{total:90,ageProgression:12,implemented:78,pending:0});
});
test("combat XP bonus increases gain and applies Veteran statistics without healing",()=>{
 const {p,enemy}=setup();
 const attacker=makeUnit(p,"Swordsman",ARCHETYPES.Swordsman,"veteran");
 const defender=makeUnit(enemy,"Club Fighter",ARCHETYPES["Club Fighter"],"fragile");
 p.units.push(attacker);enemy.units.push(defender);p.popUsed+=attacker.pop;enemy.popUsed+=defender.pop;
 attacker.hp=attacker.maxHp-15;attacker.attack=500;attacker.baseAttack=500;
 p.completed.push("MIL-07");
 strike(p,enemy,attacker.id,defender.id,{nowMs:0});
 assert.equal(attacker.experience,105);
 assert.equal(attacker.rank,"Veteran");
 assert.equal(attacker.maxHp-attacker.hp,15);
 assert.ok(attacker.attack>500);
});
test("researched gate mechanics autoclose; primitive fittings enable staffed gates",()=>{
 const {m,p,map}=setup();
 const gate=placeBuilding(map,{owner:"a",kind:"Primitive Gate",x:12,y:12,width:1,height:1});
 m.constructions={[gate.id]:{siteId:gate.id,owner:"a",kind:"Primitive Gate",completed:true,garrisonIds:[]}};
 assert.throws(()=>command(m,{player:"a",action:"gate",siteId:gate.id,open:true,autoClose:true}),/mechanisms/);
 p.completed.push("BLD-05");
 command(m,{player:"a",action:"gate",siteId:gate.id,open:true,autoClose:true});
 step(m,6000);assert.equal(m.constructions[gate.id].gateOpen,false);
 const infantry=makeUnit(p,"Archer",ARCHETYPES.Archer,"defender");
 infantry.x=11;infantry.y=12;p.units.push(infantry);p.popUsed+=infantry.pop;
 assert.throws(()=>command(m,{player:"a",action:"garrison",siteId:gate.id,unitId:infantry.id}),/fittings/);
 p.completed.push("BLD-03");
 command(m,{player:"a",action:"garrison",siteId:gate.id,unitId:infantry.id});
 assert.equal(infantry.garrisonedAt,gate.id);
});
test("Aether surveying and finite pulse extraction require separate research",()=>{
 const {m,p,map}=setup(),worker=p.units[0];
 worker.x=8;worker.y=8;p.age="III";
 const deposit=at(map,9,8);deposit.resource="Aether";deposit.amount=14;
 assert.throws(()=>command(m,{player:"a",action:"surveyAether",workerId:worker.id}),/survey/);
 p.completed.push("SPC-03");
 assert.equal(command(m,{player:"a",action:"surveyAether",workerId:worker.id}),1);
 assert.throws(()=>command(m,{player:"a",action:"aetherPulse",workerId:worker.id,x:9,y:8}),/technique/);
 p.completed.push("SPC-04");
 const before=p.resources.Aether;
 assert.equal(command(m,{player:"a",action:"aetherPulse",workerId:worker.id,x:9,y:8}).amount,8);
 assert.equal(p.resources.Aether,before+8);
 assert.throws(()=>command(m,{player:"a",action:"aetherPulse",workerId:worker.id,x:9,y:8}),/cooldown/);
 step(m,20000);
 assert.equal(command(m,{player:"a",action:"aetherPulse",workerId:worker.id,x:9,y:8}).amount,6);
 assert.equal(deposit.resource,null);
});
test("converter channels capture eligible infantry after eight seconds",()=>{
 const {m,p,enemy}=setup(),converter=makeUnit(p,"Converter",ARCHETYPES.Converter,"converter");
 converter.x=10;converter.y=10;p.units.push(converter);p.popUsed+=converter.pop;
 const target=makeUnit(enemy,"Archer",ARCHETYPES.Archer,"convertible");
 target.x=11;target.y=10;enemy.units.push(target);enemy.popUsed+=target.pop;
 p.popCap=100;p.completed.push("SPC-02");
 command(m,{player:"a",action:"convert",converterId:converter.id,targetPlayer:"b",targetId:target.id});
 step(m,9000);
 assert.equal(target.owner,"a");
 assert.ok(p.units.some(u=>u.id===target.id));
 assert.equal(enemy.units.some(u=>u.id===target.id),false);
});
test("siege disruption duration increases with research and respects cooldown",()=>{
 const {m,p,map}=setup();
 const tower=placeBuilding(map,{owner:"b",kind:"Watchtower",x:12,y:12,width:2,height:2});
 m.constructions={[tower.id]:{siteId:tower.id,owner:"b",kind:"Watchtower",completed:true,garrisonIds:[]}};
 const gun=makeUnit(p,"Heavy Artillery",ARCHETYPES["Heavy Artillery"],"disruptor");
 gun.x=9;gun.y=12;p.units.push(gun);p.popUsed+=gun.pop;
 p.completed.push("SPC-06");
 const result=command(m,{player:"a",action:"disrupt",unitId:gun.id,siteId:tower.id});
 assert.equal(result.durationMs,11000);
 assert.throws(()=>command(m,{player:"a",action:"disrupt",unitId:gun.id,siteId:tower.id}),/cooldown/);
});