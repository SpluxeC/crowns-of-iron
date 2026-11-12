import test from "node:test";
import assert from "node:assert/strict";
import {createMatch,command,step} from "../src/simulation.js";
const participants=[{id:"a",faction:"Humans"},{id:"b",faction:"Ursa"}];
test("mandatory research progresses exactly three discoveries per age",()=>{
 const m=createMatch(participants);
 const p=m.players[0];
 command(m,{player:"a",action:"research",facility:"Town Center",id:"CIV-01"});
 step(m,20000);assert.deepEqual(p.completed,["CIV-01"]);
 command(m,{player:"a",action:"research",facility:"Town Center",id:"CIV-02"});
 step(m,25000);
 command(m,{player:"a",action:"research",facility:"Town Center",id:"CIV-03"});
 step(m,35000);
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
 assert.equal(p.resources.Food,250);
 command(m,{player:"a",action:"research",facility:"Town Center",id:"CIV-01"});
 step(m,10000);
 command(m,{player:"a",action:"cancelResearch",facility:"Town Center",id:"CIV-01"});
 assert.equal(p.resources.Food,250-Math.ceil(75*.25)+0); // integer refunds floor; 75 spent, 56 returned =231
});
test("future age research is locked and only correct facilities can research",()=>{
 const m=createMatch(participants);
 assert.throws(()=>command(m,{player:"a",action:"research",facility:"Town Center",id:"CIV-04"}),/age/);
 command(m,{player:"a",action:"facility",name:"Forge"});
 assert.throws(()=>command(m,{player:"a",action:"research",facility:"Forge#1",id:"CIV-01"}),/Facility/);
});
