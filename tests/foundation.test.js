import test from "node:test";
import assert from "node:assert/strict";
import {makeRng} from "../src/random.js";
import {FACTIONS,COUNTERS,mandatory} from "../src/constants.js";
import {createMatch,command,step,checksum,replay} from "../src/simulation.js";
import {validateRoster} from "../src/extendedCatalog.js";
import {validateCatalog} from "../src/catalog.js";
const participants=[{id:"a",faction:"Humans"},{id:"b",faction:"Orcs"}];
test("six faction identities and role-count contract",()=>{
  assert.equal(FACTIONS.length,6);
  assert.deepEqual(validateRoster(),{land:22,naval:8,air:6,perFaction:36,total:216});
  assert.equal(validateCatalog(),true);
  assert.equal(mandatory.length,12);
});
test("seeded RNG is repeatable and bounded",()=>{
 const a=makeRng(181),b=makeRng(181);
 for(let i=0;i<100;i++)assert.equal(a.int(7),b.int(7));
});
test("identical command/tick streams have identical checksums",()=>{
 const events=[{player:"a",action:"allocate",workers:{Food:2,Wood:1}},{kind:"step",ms:10000},{player:"a",action:"research",facility:"Town Center",id:"CIV-01"},{kind:"step",ms:45000}];
 const a=replay(participants,7,events),b=replay(participants,7,events);
 assert.equal(checksum(a),checksum(b));
 assert.deepEqual(a.players[0].completed,["CIV-01"]);
});
test("starting resources and population are the design baseline",()=>{
 const m=createMatch(participants,1),p=m.players[0];
 assert.equal(p.popUsed,4);assert.equal(p.popCap,20);
 assert.deepEqual(p.resources,{Food:250,Wood:200,Stone:100,Metal:0,Gold:0,Aether:0});
 assert.equal(p.units.length,4);
});
test("unknown commands fail closed",()=>{
 const m=createMatch(participants);
 assert.throws(()=>command(m,{player:"a",action:"teleport"}),/Unknown action/);
 assert.throws(()=>command(m,{player:"a",action:"income",amount:{Gold:999}}),/Developer-only/);
 assert.throws(()=>command(m,{player:"nobody",action:"allocate",workers:{}}),/Unknown player/);
});

test("recovery plant shuts down cleanly when there is no upkeep Gold",()=>{
 const m=createMatch(participants),p=m.players[0];
 p.age="V";p.resources.Gold=0;
 step(m,10000,{economy:{a:{materialPlants:3,materialChoice:"Stone"}}});
 assert.equal(p.resources.Stone,100);
 assert.ok(p.resources.Food>250);
});
