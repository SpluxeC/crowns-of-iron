import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createMatch,command,step} from "../src/simulation.js";
import {installFullCatalog} from "../src/fullCatalog.js";
import {buildFactionStructures,allConstructionTypes} from "../src/structureCatalog.js";
import {STRUCTURES} from "../src/construction.js";
import {attachBattlefield} from "../src/battlefield.js";
import {makeMap,canPlace,at} from "../src/map.js";
const data=JSON.parse(readFileSync("data/balance-v0.2.json","utf8"));
test("38 named structures per faction parsed with exact costs and footprints",()=>{
 const m=createMatch([{id:"a",faction:"Humans"},{id:"b",faction:"Ursa"}]);
 installFullCatalog(m,data);
 for(const f of ["Humans","Orcs","Dwarfs","Tree Elves","Corrupt Elves","Ursa"]){
  const catalog=m.fullCatalog.buildings[f];
  assert.equal(Object.keys(catalog).length,38);
  assert.deepEqual(catalog["Great Monument"].footprint,[8,8]);
  assert.equal(catalog["Powered Gate"].hp,5000);
 }
 const ursan=m.fullCatalog.buildings.Ursa["Great Monument"];
 assert.equal(ursan.cost.Aether,300);
});
test("newly enabled wall structures use v0.2 stats and age gates",()=>{
 const m=createMatch([{id:"a",faction:"Humans"},{id:"b",faction:"Orcs"}],102);
 installFullCatalog(m,data);attachBattlefield(m,makeMap({seed:102,players:2}));
 const p=m.players[0],worker=p.units[0];
 p.resources={Food:10000,Wood:10000,Stone:10000,Metal:10000,Gold:10000,Aether:10000};
 assert.throws(()=>command(m,{player:"a",action:"build",kind:"Stone Wall",x:4,y:4,workers:[worker.id]}),/age locked/);
 p.age="III";
 let placement;
 const start=m.battlefield.starts[0];
 for(let y=1;y<m.battlefield.height-1&&!placement;y++)for(let x=1;x<m.battlefield.width-2;x++)
  if(canPlace(m.battlefield,x,y,2,1)&&Math.abs(x-start.x)+Math.abs(y-start.y)<=10){placement={x,y};break;}
 assert.ok(placement);
 const siteId=command(m,{player:"a",action:"build",kind:"Stone Wall",...placement,workers:[worker.id]});
 const site=m.constructions[siteId];
 assert.equal(site.maxHp,m.fullCatalog.buildings.Humans["Stone Wall"].hp);
 assert.deepEqual([m.battlefield.structures.find(s=>s.id===siteId).width,m.battlefield.structures.find(s=>s.id===siteId).height],[2,1]);
 step(m,site.durationMs);
 assert.equal(site.completed,true);
});
test("new structure types coexist with legacy footprint compatibility",()=>{
 const m=createMatch([{id:"a",faction:"Humans"},{id:"b",faction:"Orcs"}]);
 installFullCatalog(m,data);
 const types=allConstructionTypes(m,m.players[0],STRUCTURES);
 assert.equal(Object.keys(types).length,38);
 assert.deepEqual(types["Training Camp"].footprint,[3,3]);
 assert.deepEqual(types["Industrial Gate"].footprint,[3,2]);
});
