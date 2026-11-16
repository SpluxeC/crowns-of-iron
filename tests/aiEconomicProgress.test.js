import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createMatch,step} from "../src/simulation.js";
import {makeMap,placeBuilding} from "../src/map.js";
import {attachBattlefield} from "../src/battlefield.js";
import {installFullCatalog} from "../src/fullCatalog.js";
import {enableBot} from "../src/ai.js";
import {setEconomyMode,dropoffCandidates,deliverCargo} from "../src/spatialEconomy.js";
import {blocksBaseLogistics,tryBotConstruction} from "../src/botBasePlanner.js";
import {nextAgeTechnology,ageResearchDeficit,canFundOptionalSpend} from "../src/botResearchPlanner.js";
const data=JSON.parse(readFileSync(new URL("../data/balance-v0.2.json",import.meta.url)));
function fixture(seed=713){
 const m=createMatch([{id:"human",faction:"Orcs"},{id:"ai-1",faction:"Humans"}],seed);
 attachBattlefield(m,makeMap({width:48,height:48,players:2,seed}));
 installFullCatalog(m,data);setEconomyMode(m,"spatial");enableBot(m,"ai-1","Normal");
 return m;
}
test("Age I tech is reserved ahead of optional workers and armies",()=>{
 const m=fixture(),p=m.players[1];
 assert.equal(nextAgeTechnology(m,p)?.id,"CIV-01");
 assert.equal(canFundOptionalSpend(m,p,{Wood:120}),false);
 assert.equal(canFundOptionalSpend(m,p,{Food:45}),true);
 p.resources.Wood=10;
 assert.equal(ageResearchDeficit(m,p).Wood,
  nextAgeTechnology(m,p).cost.Wood-10);
});
test("AI construction protects start dropoff and cardinal harvest corridors",()=>{
 const m=fixture(),p=m.players[1],start=m.battlefield.starts[1];
 assert.equal(blocksBaseLogistics(m.battlefield,start.x,start.y,3,3),true);
 assert.equal(blocksBaseLogistics(m.battlefield,start.x+2,start.y,2,2),true);
 const site=tryBotConstruction(m,p);
 assert.ok(site,"AI should still find valid expansion placement");
 const constructed=m.battlefield.structures.find(s=>s.id===site.siteId);
 assert.ok(!blocksBaseLogistics(m.battlefield,
  constructed.x,constructed.y,constructed.width,constructed.height));
 assert.ok(dropoffCandidates(m,p.id).some(x=>x.x===start.x&&x.y===start.y));
});
test("blocked TC from an older save still has walkable dropoff exits",()=>{
 const m=fixture(),map=m.battlefield,p=m.players[0],
  start=map.starts[0],worker=p.units[0];
 placeBuilding(map,{owner:p.id,kind:"Training Camp",x:start.x,y:start.y,width:2,height:2});
 assert.ok(dropoffCandidates(m,p.id).length>0);
 assert.ok(!dropoffCandidates(m,p.id).some(t=>t.x===start.x&&t.y===start.y));
 worker.cargo={resource:"Wood",amount:11};
 worker.x=start.x+6;worker.y=start.y;
 assert.throws(()=>deliverCargo(m,p.id,worker.id),/not at a depot/);
 const point=dropoffCandidates(m,p.id).find(q=>q.x===start.x-2&&q.y===start.y);
 assert.ok(point);
 worker.x=point.x;worker.y=point.y;
 assert.equal(deliverCargo(m,p.id,worker.id),11);
 assert.equal(p.resources.Wood,211);
});
test("bot research planner preserves legacy non-spatial simulations",()=>{
 const m=fixture(),p=m.players[1];
 m.economyMode="abstract";
 assert.equal(canFundOptionalSpend(m,p,{Food:99999}),true);
});
