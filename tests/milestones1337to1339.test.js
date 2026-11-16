import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {botTargetSaturationPenalty} from "../src/armyAI.js";
import {harvestDepositAvailable,assignSpatialBotWorker,resourcePriorities} from "../src/spatialBot.js";
import {createRenderQuality} from "../web/mobilePerformance.js";
import {createMatch} from "../src/state.js";
import {makeMap} from "../src/map.js";
import {attachBattlefield} from "../src/battlefield.js";
import {setEconomyMode} from "../src/spatialEconomy.js";
import {installFullCatalog} from "../src/fullCatalog.js";

test("squad load penalty leaves first three attackers coordinated and spreads later ones",()=>{
 assert.equal(botTargetSaturationPenalty(0),0);
 assert.equal(botTargetSaturationPenalty(2),0);
 assert.equal(botTargetSaturationPenalty(3),85);
 assert.equal(botTargetSaturationPenalty(5),255);
 assert.throws(()=>botTargetSaturationPenalty(-1),/Invalid assigned count/);
});
test("harvest assignment ignores depleted and blocked resource tiles",()=>{
 const map={width:2,height:2,tiles:[
  {x:0,y:0,resource:"Food",amount:90},
  {x:1,y:0,resource:"Wood",amount:0},
  {x:0,y:1,resource:null,amount:0},
  {x:1,y:1,resource:"Stone",amount:30}
 ].map(tile=>({...tile,terrain:"grass",occupied:null})),structures:[]};
 // Uses the same domain walkability contract as real harvesting.
 assert.equal(harvestDepositAvailable(map,{x:0,y:0}),true);
 assert.equal(harvestDepositAvailable(map,{x:1,y:0}),false);
 assert.equal(harvestDepositAvailable(map,{x:0,y:1}),false);
 assert.equal(harvestDepositAvailable(map,{x:10,y:10}),false);
});
test("AI reassigns an empty-handed worker whose original resource has run out",()=>{
 const data=JSON.parse(readFileSync(new URL("../data/balance-v0.2.json",import.meta.url)));
 const match=createMatch([{id:"a",faction:"Humans"},{id:"b",faction:"Orcs"}],72);
 attachBattlefield(match,makeMap({seed:72,width:48,height:48,players:2}));
 installFullCatalog(match,data);setEconomyMode(match,"spatial");
 const p=match.players[1];
 const first=assignSpatialBotWorker(match,p.id);
 assert.ok(first);
 const job=match.harvestJobs[first.workerId];
 const old=match.battlefield.tiles[job.y*match.battlefield.width+job.x];
 old.amount=0;old.resource=null;
 const worker=p.units.find(u=>u.id===first.workerId);
 worker.cargo={amount:0,resource:null};
 // Keep all other workers busy: the stale assignment must not persist.
 for(const u of p.units.filter(u=>u.archetype==="Worker"&&u.id!==worker.id))
  match.harvestJobs[u.id]={owner:p.id,x:first.x,y:first.y,phase:"harvest",assignedAtMs:0};
 assignSpatialBotWorker(match,p.id);
 const next=match.harvestJobs[first.workerId];
 assert.ok(!next||next.x!==first.x||next.y!==first.y);
 assert.ok(resourcePriorities(match,p.id).length>0);
});
test("graphics quality reacts to display DPR transitions without crossing bounds",()=>{
 const q=createRenderQuality({mobile:true,devicePixelRatio:3});
 assert.equal(q.scale(),1.35);
 assert.equal(q.updateDevicePixelRatio(1),true);
 assert.equal(q.scale(),1);
 assert.equal(q.updateDevicePixelRatio(1),false);
 assert.equal(q.updateDevicePixelRatio(3),true);
 assert.ok(q.scale()>=.7&&q.scale()<=1.35);
 q.setMode("Performance");
 assert.equal(q.updateDevicePixelRatio(.5),true);
 assert.equal(q.scale(),.5);
 q.setMode("Quality");
 assert.equal(q.scale(),.5);
 assert.equal(q.updateDevicePixelRatio(Infinity),true);
 assert.equal(q.scale(),1);
});
