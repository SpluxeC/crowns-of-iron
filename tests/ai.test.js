import test from "node:test";
import assert from "node:assert/strict";
import {createMatch,step,checksum} from "../src/simulation.js";
import {enableBot,disableBot,botSummary} from "../src/ai.js";
const participants=[{id:"human",faction:"Humans"},{id:"enemy",faction:"Orcs"}];
test("AI difficulty configuration and controlled behavior",()=>{
 const m=createMatch(participants,101);
 assert.throws(()=>enableBot(m,"enemy","Impossible"),/Invalid AI/);
 enableBot(m,"enemy","Normal");
 assert.equal(botSummary(m).enemy.difficulty,"Normal");
 step(m,10000);
 assert.ok(botSummary(m).enemy.decisions>0);
 const p=m.players[1];
 assert.ok(Object.values(p.workers).reduce((a,b)=>a+b,0)<=3);
 assert.ok(p.researchQueues["Town Center"].length||p.unitQueues["Town Center"].length);
 disableBot(m,"enemy");
 assert.equal(botSummary(m).enemy,undefined);
});
test("AI actions are deterministic with identical ticks",()=>{
 const a=createMatch(participants,11),b=createMatch(participants,11);
 enableBot(a,"enemy","Hard");enableBot(b,"enemy","Hard");
 for(let i=0;i<60;i++){step(a,10000);step(b,10000);}
 assert.equal(checksum(a),checksum(b));
 assert.ok(a.players[1].units.some(u=>u.archetype==="Worker"&&u.id.startsWith("u-")));
});
test("AI can advance economy beyond Age I with sufficient time",()=>{
 const m=createMatch(participants,20);enableBot(m,"enemy","Hard");
 for(let i=0;i<240&&m.players[1].age==="I";i++)step(m,10000);
 const p=m.players[1];
 assert.equal(p.age,"II");
 assert.ok(p.completed.includes("CIV-03"));
});
test("AI refuses duplicate controller",()=>{
 const m=createMatch(participants);enableBot(m,"enemy");
 assert.throws(()=>enableBot(m,"enemy"),/already uses AI/);
});
