import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createMatch,step} from "../src/simulation.js";
import {makeMap} from "../src/map.js";
import {attachBattlefield} from "../src/battlefield.js";
import {setEconomyMode} from "../src/spatialEconomy.js";
import {installFullCatalog} from "../src/fullCatalog.js";
import {resourcePriorities,assignSpatialBotWorker} from "../src/spatialBot.js";
const data=JSON.parse(readFileSync(new URL("../data/balance-v0.2.json",import.meta.url)));
function fixture(){
 const m=createMatch([{id:"a",faction:"Humans"},{id:"b",faction:"Orcs"}],73);
 attachBattlefield(m,makeMap({seed:73,width:48,height:48,players:2}));
 installFullCatalog(m,data);setEconomyMode(m,"spatial");return m;
}
test("AI worker allocation favors Food deficit for next mandatory technology",()=>{
 const m=fixture(),p=m.players[1];
 p.completed.push("CIV-01");
 p.resources.Food=0;p.resources.Wood=300;
 assert.equal(resourcePriorities(m,p.id)[0],"Food");
 p.resources.Food=1000;p.resources.Wood=0;
 assert.equal(resourcePriorities(m,p.id)[0],"Wood");
});
test("AI avoids age-locked resources in Age I",()=>{
 const m=fixture(),p=m.players[1];
 for(let i=0;i<3;i++)assignSpatialBotWorker(m,p.id);
 const selected=Object.values(m.harvestJobs);
 assert.ok(selected.every(job=>["Food","Wood","Stone","Gold"].includes(
  m.battlefield.tiles[job.y*m.battlefield.width+job.x].resource)));
});
test("full-catalog workers collect and deliver real inventory instead of ghost income",()=>{
 const m=fixture(),p=m.players[1],initial={...p.resources};
 for(let i=0;i<3;i++)assignSpatialBotWorker(m,p.id);
 for(let i=0;i<130;i++)step(m,1000);
 assert.ok(Object.values(p.resources).some((value,i)=>
  value>Object.values(initial)[i]));
 assert.ok(Object.values(m.harvestJobs).every(job=>
  Number.isInteger(job.x)&&Number.isInteger(job.y)));
});
