import test from "node:test";
import assert from "node:assert/strict";
import {createMatch,step} from "../src/simulation.js";
import {attachBattlefield} from "../src/battlefield.js";
import {makeMap} from "../src/map.js";
import {setEconomyMode} from "../src/spatialEconomy.js";
import {installFullCatalog} from "../src/fullCatalog.js";
import {enableBot} from "../src/ai.js";
import {desiredBotBuilding,tryBotConstruction} from "../src/botBasePlanner.js";
import {readFileSync} from "node:fs";
const catalog=JSON.parse(readFileSync(new URL("../data/balance-v0.2.json",import.meta.url)));
function match(seed=712){
 const m=createMatch([{id:"human",faction:"Humans"},{id:"ai",faction:"Orcs"}],seed);
 attachBattlefield(m,makeMap({width:48,height:48,players:2,seed}));
 installFullCatalog(m,catalog);setEconomyMode(m,"spatial");enableBot(m,"ai","Normal");
 return m;
}
test("spatial AI builds its first military building without free resources",()=>{
 const m=match(),ai=m.players[1],prior={...ai.resources};
 const plan=desiredBotBuilding(m,ai);
 assert.equal(plan.kind,"Training Camp");
 const action=tryBotConstruction(m,ai);
 assert.ok(action&&action.siteId);
 assert.ok(m.constructions[action.siteId].owner==="ai");
 assert.equal(m.constructions[action.siteId].kind,"Training Camp");
 assert.ok(ai.resources.Wood<prior.Wood);
 assert.ok(ai.resources.Stone<prior.Stone);
 assert.equal(tryBotConstruction(m,ai),null,"Cannot duplicate planned building");
});
test("AI supports low-population housing before military expansion",()=>{
 const m=match(),ai=m.players[1];
 ai.popCap=ai.popUsed+3;
 assert.equal(desiredBotBuilding(m,ai)?.kind,"Shelter");
});
test("AI respects building ages, costs and incomplete sites",()=>{
 const m=match(),ai=m.players[1];
 ai.resources.Wood=0;ai.resources.Stone=0;
 assert.equal(desiredBotBuilding(m,ai),null);
 ai.resources.Wood=500;ai.resources.Stone=500;
 assert.notEqual(desiredBotBuilding(m,ai)?.kind,"Barracks");
});
test("120 seconds of active spatial AI is deterministic and supports production",()=>{
 const a=match(712),b=match(712);
 for(let i=0;i<120;i++){step(a,1000);step(b,1000);}
 const summarize=m=>({
  resources:m.players[1].resources,
  age:m.players[1].age,
  facilities:m.players[1].facilities,
  jobs:Object.keys(m.harvestJobs??{}).length,
  built:Object.values(m.constructions??{}).map(j=>[j.kind,j.owner,j.completed]),
  units:m.players[1].units.filter(u=>u.alive).map(u=>[u.id,u.archetype,u.x,u.y])
 });
 assert.deepEqual(summarize(a),summarize(b));
 assert.ok(Object.values(a.constructions??{}).some(j=>j.owner==="ai"),
  "AI should place at least one structure within 2 minutes");
 assert.ok(Object.entries(a.harvestJobs).some(([,job])=>job.owner==="ai"),
  "AI should keep workers actively harvesting");
});
