import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createMatch,command,step} from "../src/simulation.js";
import {installFullCatalog} from "../src/fullCatalog.js";
import {makeMap,placeBuilding} from "../src/map.js";
import {attachBattlefield} from "../src/battlefield.js";
import {upgradeCoverage} from "../src/buildingUpgrades.js";
import {makeUnit} from "../src/state.js";
import {ARCHETYPES} from "../src/catalog.js";
import {ALL_ARCHETYPES} from "../src/extendedCatalog.js";
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
 for(let left=job.durationMs;left>0;left-=Math.min(left,60000))step(m,Math.min(left,60000));
 const before=p.resources.Food;step(m,10000);
 assert.equal(p.resources.Food-before,22);
});
test("watchtower emplacement creates one additional firing slot",()=>{
 const {m,site}=fixture("Watchtower");
 const job=command(m,{player:"a",action:"upgrade",siteId:site.id,name:"Archery Emplacements"});
 for(let left=job.durationMs;left>0;left-=Math.min(left,60000))step(m,Math.min(left,60000));
 assert.equal(m.constructions[site.id].localGarrisonSlots,1);
});
test("stable core increases condenser production",()=>{
 const {m,p,site}=fixture("Aether Condenser");m.economyMode="spatial";
 const job=command(m,{player:"a",action:"upgrade",siteId:site.id,name:"Stable Core"});
 for(let left=job.durationMs;left>0;left-=Math.min(left,60000))step(m,Math.min(left,60000));
 const before=p.resources.Aether;step(m,60000);step(m,40000);
 assert.equal(p.resources.Aether-before,33);
});

test("medical tools improve active staffed healing but do not regenerate patients passively",()=>{
 const {m,p,site}=fixture("Field Hospital");
 const healer=makeUnit(p,"Healer",ARCHETYPES.Healer,"healer");
 const patient=makeUnit(p,"Swordsman",ARCHETYPES.Swordsman,"patient");
 healer.x=11;healer.y=12;patient.x=11;patient.y=13;patient.hp-=50;
 p.units.push(healer,patient);p.popUsed+=healer.pop+patient.pop;
 const job=command(m,{player:"a",action:"upgrade",siteId:site.id,name:"Medical Tools"});
 for(let left=job.durationMs;left>0;left-=Math.min(left,60000))step(m,Math.min(left,60000));
 const before=patient.hp;
 const amount=command(m,{player:"a",action:"hospitalHeal",siteId:site.id,
  healers:[healer.id],targetId:patient.id});
 assert.equal(amount,14);
 assert.equal(patient.hp-before,14);
 step(m,1000);assert.equal(patient.hp,before+14);
});
test("repair yard improves only staffed nearby ship repairs",()=>{
 const {m,p,site}=fixture("Dock");
 const worker=p.units[0];worker.x=11;worker.y=12;
 const vessel=makeUnit(p,"Light Warship",ALL_ARCHETYPES["Light Warship"],"test-vessel");
 vessel.x=11;vessel.y=13;vessel.hp-=90;
 p.units.push(vessel);p.popUsed+=vessel.pop;
 assert.throws(()=>command(m,{player:"a",action:"vehicleRepair",siteId:site.id,
   workers:[worker.id],targetId:vessel.id,amount:100}),/Upgraded/);
 const job=command(m,{player:"a",action:"upgrade",siteId:site.id,name:"Repair Yard"});
 for(let left=job.durationMs;left>0;left-=Math.min(left,60000))step(m,Math.min(left,60000));
 const result=command(m,{player:"a",action:"vehicleRepair",siteId:site.id,
  workers:[worker.id],targetId:vessel.id,amount:100});
 assert.equal(result.restored,44);
});
