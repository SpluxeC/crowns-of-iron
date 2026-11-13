import test from "node:test";
import assert from "node:assert/strict";
import {createMatch} from "../src/simulation.js";
import {makeUnit} from "../src/state.js";
import {ALL_ARCHETYPES} from "../src/extendedCatalog.js";
import {refreshUnitTechnology,applyTechnologyCompletion,researchMultiplier,executableCoverage} from "../src/technologyEffects.js";
import {readFileSync} from "node:fs";
const player=createMatch([{id:"a",faction:"Humans"},{id:"b",faction:"Ursa"}]).players[0];
test("ten more optional technologies have typed effect handlers",()=>{
 const d=JSON.parse(readFileSync("data/balance-v0.2.json","utf8"));
 const ids=d.research.rows.filter(r=>r[0]==="Humans").map(r=>r[1]);
 assert.deepEqual(executableCoverage(ids),{total:90,ageProgression:12,implemented:70,pending:8});
});
test("transport capacity bonuses apply once and retain base capacity",()=>{
 const p=createMatch([{id:"a",faction:"Humans"},{id:"b",faction:"Ursa"}]).players[0];
 const ship=makeUnit(p,"Transport Ship",ALL_ARCHETYPES["Transport Ship"],"transport");
 const plane=makeUnit(p,"Air Transport",ALL_ARCHETYPES["Air Transport"],"airtransport");
 p.units.push(ship,plane);p.popUsed+=ship.pop+plane.pop;
 assert.equal(ship.passengerCapacity,16);
 assert.equal(plane.passengerCapacity,12);
 p.completed.push("NAV-04");applyTechnologyCompletion(p,"NAV-04");
 assert.equal(ship.passengerCapacity,18);assert.equal(plane.passengerCapacity,12);
 p.completed.push("AIR-09");applyTechnologyCompletion(p,"AIR-09");
 assert.equal(plane.passengerCapacity,14);
 refreshUnitTechnology(p,ship);
 assert.equal(ship.passengerCapacity,18);
});
test("naval trade and fish bonuses affect actual multipliers, not worker gathering",()=>{
 const p=createMatch([{id:"a",faction:"Humans"},{id:"b",faction:"Ursa"}]).players[0];
 p.completed.push("ECO-09","NAV-10","FAC-14","NAV-03");
 assert.equal(researchMultiplier(p,"tradeRevenue"),1.15);
 assert.equal(researchMultiplier(p,"fishOutput"),1.10);
 assert.equal(researchMultiplier(p,"gather",{resource:"Food"}),1);
});
