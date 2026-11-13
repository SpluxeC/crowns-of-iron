import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createMatch,command,step} from "../src/simulation.js";
import {installFullCatalog} from "../src/fullCatalog.js";
import {makeMap,placeBuilding} from "../src/map.js";
import {attachBattlefield} from "../src/battlefield.js";
import {upgradeCoverage} from "../src/buildingUpgrades.js";
const data=JSON.parse(readFileSync("data/balance-v0.2.json","utf8"));
function fixture(kind="Farm"){
 const m=createMatch([{id:"a",faction:"Humans"},{id:"b",faction:"Orcs"}],44);
 installFullCatalog(m,data);const map=makeMap({seed:44,players:2});
 for(const t of map.tiles){t.terrain="grass";t.occupied=null;t.resource=null;t.amount=0;}
 attachBattlefield(m,map);
 const p=m.players[0];p.age="V";p.resources={Food:99999,Wood:99999,Stone:99999,Metal:99999,Gold:99999,Aether:99999};
 const site=placeBuilding(map,{owner:"a",kind,x:12,y:12,width:2,height:2});
 m.constructions={[site.id]:{siteId:site.id,kind,owner:"a",completed:true,maxHp:1000,hp:1000,cost:{Wood:100,Metal:100},armor:4}};
 return {m,p,site};
}
test("all 126 building upgrade records have typed effects",()=>{
 const {m}=fixture();
 assert.deepEqual(upgradeCoverage(m),{catalog:126,executable:126,pending:0});
});
test("farm irrigation increases only that farm's output",()=>{
 const {m,p,site}=fixture("Farm");m.economyMode="spatial";
 const job=command(m,{player:"a",action:"upgrade",siteId:site.id,name:"Improved Irrigation"});
 step(m,job.durationMs);
 const before=p.resources.Food;step(m,10000);
 assert.equal(p.resources.Food-before,22);
});
test("watchtower emplacement creates one additional firing slot",()=>{
 const {m,site}=fixture("Watchtower");
 const job=command(m,{player:"a",action:"upgrade",siteId:site.id,name:"Archery Emplacements"});
 step(m,job.durationMs);
 assert.equal(m.constructions[site.id].localGarrisonSlots,1);
});
test("stable core increases condenser production",()=>{
 const {m,p,site}=fixture("Aether Condenser");m.economyMode="spatial";
 const job=command(m,{player:"a",action:"upgrade",siteId:site.id,name:"Stable Core"});
 step(m,job.durationMs);
 const before=p.resources.Aether;step(m,100000);
 assert.equal(p.resources.Aether-before,33);
});
