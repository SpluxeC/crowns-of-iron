import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createMatch} from "../src/simulation.js";
import {installFullCatalog} from "../src/fullCatalog.js";
import {upgradeCoverage,queueBuildingUpgrade,tickBuildingUpgrades} from "../src/buildingUpgrades.js";
const data=JSON.parse(readFileSync("data/balance-v0.2.json","utf8"));
function matchAtAge(age="V"){
 const m=createMatch([{id:"a",faction:"Humans"},{id:"b",faction:"Ursa"}]);
 installFullCatalog(m,data);
 const player=m.players[0];
 player.age=age;player.resources={Food:20000,Wood:20000,Stone:20000,Metal:20000,Gold:20000,Aether:20000};
 return {m,player};
}
test("21 upgrade identities are executable for every faction, none pending",()=>{
 const {m}=matchAtAge();
 assert.deepEqual(upgradeCoverage(m),{catalog:126,executable:126,pending:0});
});
test("completed Town Center Extended Housing adds exactly five population cap",()=>{
 const {m,player}=matchAtAge("III");
 m.constructions={test:{siteId:"test",owner:"a",kind:"Town Center",completed:true,hp:2000,maxHp:2000}};
 const job=queueBuildingUpgrade(m,"a","test","Extended Housing");
 tickBuildingUpgrades(m,job.durationMs);
 assert.equal(player.popCap,25);
 assert.equal(m.constructions.test.upgradeHousing,5);
 assert.ok(m.constructions.test.upgrades.includes("Extended Housing"));
});
test("two Barracks training upgrades stack additively",()=>{
 const {m}=matchAtAge("V");
 const site={siteId:"test",owner:"a",kind:"Barracks",completed:true,hp:1050,maxHp:1050};
 m.constructions={test:site};
 const first=queueBuildingUpgrade(m,"a","test","Training Equipment I");
 tickBuildingUpgrades(m,first.durationMs);
 const second=queueBuildingUpgrade(m,"a","test","Assembly Equipment");
 tickBuildingUpgrades(m,second.durationMs);
 assert.ok(Math.abs(site.trainTimeFactor-.85)<1e-10);
});
test("building-upgrade ownership cannot be forged",()=>{
 const {m}=matchAtAge("V");
 m.constructions={test:{siteId:"test",owner:"b",kind:"Barracks",completed:true,hp:1050,maxHp:1050}};
 assert.throws(()=>queueBuildingUpgrade(m,"a","test","Training Equipment I"),/Must own/);
});
