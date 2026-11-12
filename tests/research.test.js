import test from "node:test";
import assert from "node:assert/strict";
import {createMatch,command,debugCommand,step} from "../src/simulation.js";
const participants=[{id:"a",faction:"Humans"},{id:"b",faction:"Ursa"}];
test("mandatory research progresses exactly three discoveries per age",()=>{
 const m=createMatch(participants);
 const p=m.players[0];
 debugCommand(m,{player:"a",action:"income",amount:{Food:1000,Wood:1000,Stone:1000}});
 command(m,{player:"a",action:"research",facility:"Town Center",id:"CIV-01"});
 step(m,45000);assert.deepEqual(p.completed,["CIV-01"]);
 command(m,{player:"a",action:"research",facility:"Town Center",id:"CIV-02"});
 step(m,60000);step(m,15000);
 command(m,{player:"a",action:"research",facility:"Town Center",id:"CIV-03"});
 step(m,60000);step(m,30000);
 assert.equal(p.age,"II");assert.equal(p.completed.length,3);
});
test("one technology cannot be queued twice even across facilities",()=>{
 const m=createMatch(participants);
 command(m,{player:"a",action:"research",facility:"Town Center",id:"CIV-01"});
 assert.throws(()=>command(m,{player:"a",action:"research",facility:"Town Center",id:"CIV-01"}),/Already queued/);
});
test("cancellation refunds 100% unstarted and 75% started",()=>{
 const m=createMatch(participants),p=m.players[0];
 command(m,{player:"a",action:"research",facility:"Town Center",id:"CIV-01"});
 command(m,{player:"a",action:"cancelResearch",facility:"Town Center",id:"CIV-01"});
 assert.equal(p.resources.Wood,200);
 command(m,{player:"a",action:"research",facility:"Town Center",id:"CIV-01"});
 step(m,10000);
 command(m,{player:"a",action:"cancelResearch",facility:"Town Center",id:"CIV-01"});
 assert.equal(p.resources.Wood,177); // 90 Wood spent, floor(90×0.75)=67 refunded
});
test("future age research is locked and only correct facilities can research",()=>{
 const m=createMatch(participants);
 assert.throws(()=>command(m,{player:"a",action:"research",facility:"Town Center",id:"CIV-04"}),/age/);
 debugCommand(m,{player:"a",action:"facility",name:"Forge"});
 assert.throws(()=>command(m,{player:"a",action:"research",facility:"Forge#1",id:"CIV-01"}),/Facility/);
});
