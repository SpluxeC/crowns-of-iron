import test from "node:test";
import assert from "node:assert/strict";
import {createMatch,step,checksum} from "../src/simulation.js";
import {attachBattlefield} from "../src/battlefield.js";
import {makeMap} from "../src/map.js";
import {setEconomyMode} from "../src/spatialEconomy.js";
import {enableBot} from "../src/ai.js";
import {assignSpatialBotWorker} from "../src/spatialBot.js";
function fixture(){
 const m=createMatch([{id:"a",faction:"Humans"},{id:"b",faction:"Orcs"}],93);
 attachBattlefield(m,makeMap({seed:93,players:2}));
 setEconomyMode(m,"spatial");enableBot(m,"b","Hard");
 return m;
}
test("spatial AI assigns owned workers to reachable finite resources",()=>{
 const m=fixture(),p=m.players[1];
 const first=assignSpatialBotWorker(m,p.id);
 assert.ok(first);
 assert.ok(m.harvestJobs[first.workerId]);
 assert.equal(p.units.some(u=>u.id===first.workerId&&u.archetype==="Worker"),true);
 assert.notEqual(assignSpatialBotWorker(m,p.id)?.workerId,first.workerId);
});
test("spatial AI produces delivered income without abstract worker income",()=>{
 const m=fixture(),p=m.players[1],before={...p.resources};
 for(let i=0;i<120;i++)step(m,1000);
 const deliveries=Object.keys(before).filter(k=>p.resources[k]>before[k]);
 assert.ok(deliveries.length>0,"AI has no delivered resources");
 assert.ok(Object.values(m.harvestJobs??{}).some(job=>job.owner==="b"));
});
test("same seed and bot decisions produce matching spatial economy state",()=>{
 const a=fixture(),b=fixture();
 for(let i=0;i<60;i++){step(a,1000);step(b,1000);}
 assert.equal(checksum(a),checksum(b));
});
