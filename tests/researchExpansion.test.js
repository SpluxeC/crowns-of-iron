import test from "node:test";
import assert from "node:assert/strict";
import {createMatch,step,command} from "../src/simulation.js";
import {makeMap,at} from "../src/map.js";
import {attachBattlefield} from "../src/battlefield.js";
import {setEconomyMode,assignHarvestJob} from "../src/spatialEconomy.js";
import {refreshStructureTechnology,researchMultiplier,structureTechnologyMultiplier,executableCoverage} from "../src/technologyEffects.js";
import {readFileSync} from "node:fs";
const data=JSON.parse(readFileSync("data/balance-v0.2.json","utf8"));
const participants=[{id:"a",faction:"Humans"},{id:"b",faction:"Orcs"}];
test("78 optional technologies have typed handlers; none remain pending",()=>{
 const ids=data.research.rows.filter(r=>r[0]==="Humans").map(r=>r[1]);
 assert.deepEqual(executableCoverage(ids),{total:90,ageProgression:12,implemented:78,pending:0});
});
test("building research upgrades stack additively, preserve missing HP, do not regenerate",()=>{
 const m=createMatch(participants),p=m.players[0];
 const wall={siteId:"wall",owner:"a",kind:"Stone Wall",completed:true,hp:1500,maxHp:1800,rawBaseHp:1800,localHpFactor:1};
 m.constructions={wall};
 p.completed.push("BLD-01");refreshStructureTechnology(m,p);
 assert.equal(wall.maxHp,1944);assert.equal(wall.maxHp-wall.hp,300);
 p.completed.push("BLD-06");refreshStructureTechnology(m,p);
 assert.equal(wall.maxHp,2124);assert.equal(wall.maxHp-wall.hp,300);
 step(m,3000);assert.equal(wall.maxHp-wall.hp,300);
 assert.equal(structureTechnologyMultiplier(p,"Stone Wall"),1.18);
});
test("spatial carry research raises capacity from thirty to thirty-two",()=>{
 const m=createMatch(participants,75);
 attachBattlefield(m,makeMap({seed:75,players:2}));setEconomyMode(m,"spatial");
 const p=m.players[0],w=p.units[0],s=m.battlefield.starts[0],target=at(m.battlefield,s.x+3,s.y);
 w.x=target.x;w.y=target.y;p.completed.push("ECO-10");
 target.amount=150;
 assignHarvestJob(m,"a",w.id,target.x,target.y);
 step(m,7000);
 assert.equal(w.cargo.amount,32);
});
test("aircraft structure damage and mechanical salvage tech are selective",()=>{
 const p=createMatch(participants).players[0];p.completed.push("AIR-08","SPC-07","SPC-09","FAC-08");
 const bomber={archetype:"Bomber",type:"Explosive"};
 const infantry={archetype:"Swordsman",type:"Slash"};
 assert.equal(researchMultiplier(p,"structureAttack",{unit:bomber}),1.08);
 assert.equal(researchMultiplier(p,"structureAttack",{unit:infantry}),1);
 assert.equal(researchMultiplier(p,"salvage"),1.05);
 assert.equal(researchMultiplier(p,"repair"),1.10);
 assert.equal(researchMultiplier(p,"unitAttack",{unit:{archetype:"Battering Ram",type:"Crush"}}),1.08);
});
test("factory throughput bonus affects production multiplier independently",()=>{
 const p=createMatch(participants).players[0];
 p.completed.push("FAC-07");
 assert.equal(researchMultiplier(p,"production"),1.05);
 assert.equal(researchMultiplier(p,"gather",{resource:"Food"}),1);
});
