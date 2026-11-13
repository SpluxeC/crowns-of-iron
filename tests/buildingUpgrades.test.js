import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createMatch,command,step} from "../src/simulation.js";
import {makeMap,canPlace} from "../src/map.js";
import {attachBattlefield} from "../src/battlefield.js";
import {installFullCatalog} from "../src/fullCatalog.js";
import {upgradeCoverage} from "../src/buildingUpgrades.js";
const data=JSON.parse(readFileSync("data/balance-v0.2.json","utf8"));
function fixture(){
 const m=createMatch([{id:"a",faction:"Humans"},{id:"b",faction:"Orcs"}],68);
 installFullCatalog(m,data);attachBattlefield(m,makeMap({seed:68,players:2}));
 const p=m.players[0];p.age="IV";
 p.resources={Food:20000,Wood:20000,Stone:20000,Metal:20000,Gold:20000,Aether:20000};
 const worker=p.units[0],start=m.battlefield.starts[0];
 let pos;
 for(let y=0;y<m.battlefield.height-4&&!pos;y++)for(let x=0;x<m.battlefield.width-4;x++)
  if(canPlace(m.battlefield,x,y,4,4)&&Math.abs(x-start.x)+Math.abs(y-start.y)<12){pos={x,y};break;}
 assert.ok(pos);
 const siteId=command(m,{player:"a",action:"build",kind:"Barracks",...pos,workers:[worker.id]});
 step(m,50000);
 assert.equal(m.constructions[siteId].completed,true);
 return {m,p,siteId};
}
test("all 126 local upgrades are cataloged with supported and pending effects separated",()=>{
 const m=createMatch([{id:"a",faction:"Humans"},{id:"b",faction:"Orcs"}]);
 installFullCatalog(m,data);const c=upgradeCoverage(m);
 assert.equal(c.catalog,126);assert.ok(c.executable>=12);assert.equal(c.pending,0);
});
test("training upgrade is queued, researched, and shortens later unit production",()=>{
 const {m,p,siteId}=fixture(),site=m.constructions[siteId];
 const key=site.facilityKey;
 const job=command(m,{player:"a",action:"upgrade",siteId,name:"Training Equipment I"});
 assert.ok(job.durationMs>0);
 assert.throws(()=>command(m,{player:"a",action:"upgrade",siteId,name:"Training Equipment I"}),/already owned or queued/);
 step(m,job.durationMs);
 assert.ok(site.upgrades.includes("Training Equipment I"));
 assert.equal(site.trainTimeFactor,.9);
 command(m,{player:"a",action:"train",facility:key,role:"Swordsman"});
 assert.equal(p.unitQueues[key].length,1);
 const expected=Math.ceil(p.unitQueues[key][0].definition.ms*.9);
 step(m,expected);
 assert.equal(p.unitQueues[key].length,0);
});
test("unsupported upgrades cannot spend resources, and cancellation refunds unstarted cost",()=>{
 const {m,p,siteId}=fixture();
 const before=p.resources.Wood;
 assert.throws(()=>command(m,{player:"a",action:"upgrade",siteId,name:"Unimplemented Upgrade"}),/not implemented/);
 assert.equal(p.resources.Wood,before);
 command(m,{player:"a",action:"upgrade",siteId,name:"Training Equipment I"});
 command(m,{player:"a",action:"cancelUpgrade",siteId,name:"Training Equipment I"});
 assert.equal(p.resources.Wood,before);
});
test("reinforced Barracks improves HP without enabling passive regeneration",()=>{
 const {m,siteId}=fixture(),site=m.constructions[siteId];
 site.hp-=100;const missing=100;
 const job=command(m,{player:"a",action:"upgrade",siteId,name:"Reinforced Barracks"});
 step(m,job.durationMs);
 assert.equal(site.maxHp,Math.round(1050*1.15));
 assert.equal(site.maxHp-site.hp,missing);
 step(m,30000);
 assert.equal(site.maxHp-site.hp,missing);
});
