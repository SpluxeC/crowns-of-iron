import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createMatch,command,step} from "../src/simulation.js";
import {installFullCatalog} from "../src/fullCatalog.js";
import {makeUnit} from "../src/state.js";
import {ARCHETYPES} from "../src/catalog.js";
import {applyTechnologyCompletion,refreshUnitTechnology,researchMultiplier,technologyEffectStatus,executableCoverage} from "../src/technologyEffects.js";
const data=JSON.parse(readFileSync("data/balance-v0.2.json","utf8"));
const participants=[{id:"a",faction:"Humans"},{id:"b",faction:"Ursa"}];
test("typed technology coverage reports all 78 optional prototype effects",()=>{
 const ids=data.research.rows.filter(r=>r[0]==="Humans").map(r=>r[1]);
 const coverage=executableCoverage(ids);
 assert.equal(coverage.total,90);
 assert.equal(coverage.ageProgression,12);
 assert.ok(coverage.implemented>=30);
 assert.equal(coverage.pending,0);
 assert.equal(technologyEffectStatus("MIL-01"),"implemented");
 assert.equal(technologyEffectStatus("SPC-02"),"implemented");
});
test("researched physical attack tech updates existing and subsequently trained soldiers",()=>{
 const m=createMatch(participants),p=m.players[0];installFullCatalog(m,data);
 const base=makeUnit(p,"Swordsman",ARCHETYPES.Swordsman,"test-sword");
 p.units.push(base);p.popUsed++;
 const starting=base.attack;
 p.completed.push("MIL-01");applyTechnologyCompletion(p,"MIL-01");
 assert.equal(base.attack,Math.round(starting*1.05*1000)/1000);
 const newSoldier=makeUnit(p,"Swordsman",ARCHETYPES.Swordsman,"future-sword");
 refreshUnitTechnology(p,newSoldier);
 assert.equal(newSoldier.attack,base.attack);
 p.completed.push("MIL-02");applyTechnologyCompletion(p,"MIL-02");
 assert.equal(base.attack,Math.round(starting*1.10*1000)/1000);
});
test("HP upgrades preserve missing HP instead of healing damage",()=>{
 const m=createMatch(participants),p=m.players[0],unit=makeUnit(p,"Swordsman",ARCHETYPES.Swordsman,"damaged");
 p.units.push(unit);p.popUsed++;
 unit.hp-=35;const missing=unit.maxHp-unit.hp;
 p.completed.push("MIL-03");applyTechnologyCompletion(p,"MIL-03");
 assert.equal(unit.maxHp-unit.hp,missing);
 assert.equal(unit.maxHp,126);
});
test("research Worker gathering bonuses stack additively",()=>{
 const p=createMatch(participants).players[0];
 p.completed.push("ECO-01","ECO-08","FAC-01");
 assert.equal(researchMultiplier(p,"gather",{resource:"Food"}),1.15);
 assert.equal(researchMultiplier(p,"gather",{resource:"Stone"}),1.10);
});
test("actual optional research completes on its research channel and applies effects",()=>{
 const m=createMatch(participants),p=m.players[0];installFullCatalog(m,data);
 p.age="III";p.resources={Food:9999,Wood:9999,Stone:9999,Metal:9999,Gold:9999,Aether:9999};
 p.facilities.Forge=1;p.researchQueues["Forge#1"]=[];
 const unit=makeUnit(p,"Swordsman",ARCHETYPES.Swordsman,"unit");p.units.push(unit);p.popUsed++;
 command(m,{player:"a",action:"research",facility:"Forge#1",id:"MIL-01"});
 const seconds=m.fullCatalog.techs.Humans["MIL-01"].ms;
 step(m,Math.min(60000,seconds));
 if(seconds>60000)step(m,seconds-60000);
 assert.ok(p.completed.includes("MIL-01"));
 assert.ok(unit.attack>15);
});
