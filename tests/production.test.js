import test from "node:test";
import assert from "node:assert/strict";
import {createMatch,command,step} from "../src/simulation.js";
import {killUnit,setPopCap,addFacility} from "../src/state.js";
const participants=[{id:"a",faction:"Humans"},{id:"b",faction:"Ursa"}];
test("train worker spends Food, creates population after 15 seconds",()=>{
 const m=createMatch(participants),p=m.players[0];
 command(m,{player:"a",action:"train",facility:"Town Center",role:"Worker"});
 assert.equal(p.resources.Food,200);
 step(m,15000);assert.equal(p.popUsed,5);assert.equal(p.units.filter(u=>u.alive&&u.archetype==="Worker").length,4);
});
test("recruitment waits for population rather than spawning illegally",()=>{
 const m=createMatch(participants),p=m.players[0];
 setPopCap(p,4);
 command(m,{player:"a",action:"train",facility:"Town Center",role:"Worker"});
 step(m,15000);
 assert.equal(p.popUsed,4);assert.equal(p.unitQueues["Town Center"].length,1);
 setPopCap(p,5);step(m,1000);
 assert.equal(p.popUsed,5);assert.equal(p.unitQueues["Town Center"].length,0);
});
test("hero and legendary uniqueness is enforced across queues",()=>{
 const m=createMatch(participants),p=m.players[0];
 p.age="V";addFacility(p,"Support Sanctuary");addFacility(p,"Grand Factory");p.resources.Food=9999;p.resources.Gold=9999;p.resources.Metal=9999;p.resources.Stone=9999;p.resources.Aether=9999;
 command(m,{player:"a",action:"train",facility:"Support Sanctuary#1",role:"Hero"});
 assert.throws(()=>command(m,{player:"a",action:"train",facility:"Support Sanctuary#1",role:"Hero"}),/Unique/);
 command(m,{player:"a",action:"train",facility:"Grand Factory#1",role:"Legendary Land"});
 assert.throws(()=>command(m,{player:"a",action:"train",facility:"Grand Factory#1",role:"Legendary Land"}),/Unique/);
});
test("death frees population and permits recruitment of the fallen hero",()=>{
 const m=createMatch(participants),p=m.players[0];
 p.age="III";addFacility(p,"Support Sanctuary");p.resources.Food=999;p.resources.Gold=999;
 command(m,{player:"a",action:"train",facility:"Support Sanctuary#1",role:"Hero"});
 step(m,60000);step(m,20000);
 const h=p.units.find(u=>u.alive&&u.archetype==="Hero");
 assert.ok(h);assert.equal(p.popUsed,10);
 killUnit(p,h.id);assert.equal(p.popUsed,4);
 command(m,{player:"a",action:"train",facility:"Support Sanctuary#1",role:"Hero"});
 assert.equal(p.unitQueues["Support Sanctuary#1"].length,1);
});
