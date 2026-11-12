import test from "node:test";
import assert from "node:assert/strict";
import {damage,heal,repair,applyStatus,tickStatuses} from "../src/combat.js";
import {createMatch} from "../src/simulation.js";
import {makeUnit} from "../src/state.js";
import {ARCHETYPES} from "../src/catalog.js";
test("counter table and armor formula match design examples",()=>{
 assert.equal(damage(15,5,"Slash","Standard"),14);
 assert.equal(damage(13,0,"Pierce","Light"),16);
 assert.equal(damage(13,12,"Pierce","Heavy"),8);
 assert.equal(damage(70,18,"Crush","Masonry"),88);
 assert.equal(damage(0,0),0);
});
test("active healing only: damaged units do not regenerate during idle ticks",()=>{
 const m=createMatch([{id:"a",faction:"Humans"},{id:"b",faction:"Orcs"}]),p=m.players[0];
 const target=p.units[0];target.hp=10;
 tickStatuses(p,10000);assert.equal(target.hp,10);
 const healer=makeUnit(p,"Healer",ARCHETYPES.Healer,"h");
 p.units.push(healer);
 assert.equal(heal(p,["h"],target.id),12);
 assert.equal(target.hp,22);
});
test("duplicate healer is rejected and healing never exceeds max HP",()=>{
 const m=createMatch([{id:"a",faction:"Humans"},{id:"b",faction:"Orcs"}]),p=m.players[0],u=p.units[0];
 const h=makeUnit(p,"Healer",ARCHETYPES.Healer,"h");
 p.units.push(h);
 assert.throws(()=>heal(p,["h","h"],u.id),/Duplicate/);
 u.hp=64;assert.equal(heal(p,["h"],u.id),1);assert.equal(u.hp,65);
});
test("mechanical units require physical repair; spent resources are counted",()=>{
 const m=createMatch([{id:"a",faction:"Humans"},{id:"b",faction:"Orcs"}]),p=m.players[0];
 const machine=makeUnit(p,"Siege Tower",ARCHETYPES["Siege Tower"],"siege");
 p.units.push(machine);machine.hp=500;p.resources.Metal=100;
 assert.throws(()=>heal(p,["missing"],"siege"),/Mechanical/);
 const before=p.resources.Metal;
 const r=repair(p,[p.units[0].id],"siege",50);
 assert.equal(r.restored,50);assert.equal(machine.hp,550);assert.ok(p.resources.Metal<before);
});
test("Burning refreshes rather than stacking unlimited copies",()=>{
 const m=createMatch([{id:"a",faction:"Humans"},{id:"b",faction:"Orcs"}]),p=m.players[0],u=p.units[0];
 applyStatus(u,"Burning",5000,3);applyStatus(u,"Burning",5000,3);
 assert.equal(u.status.length,1);tickStatuses(p,2000);assert.equal(u.hp,59);
});
