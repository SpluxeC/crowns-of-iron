import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createMatch} from "../src/state.js";
import {makeMap} from "../src/map.js";
import {attachBattlefield} from "../src/battlefield.js";
import {installFullCatalog} from "../src/fullCatalog.js";
import {setEconomyMode} from "../src/spatialEconomy.js";
import {planArmyOrders} from "../src/armyAI.js";
import {viableHarvestSites,assignSpatialBotWorker} from "../src/spatialBot.js";
import {battlefieldRenderSize} from "../web/mobilePerformance.js";

test("army indexing keeps live target IDs valid when enemy roster is large",()=>{
 const m=createMatch([{id:"human",faction:"Humans"},{id:"ai",faction:"Orcs"}],87);
 attachBattlefield(m,makeMap({width:48,height:48,players:2,seed:87}));
 const p=m.players[1],foe=m.players[0],attacker=p.units.find(u=>u.archetype==="Scout");
 const start=m.battlefield.starts[1];attacker.x=start.x;attacker.y=start.y;
 const enemy=foe.units.find(u=>u.archetype==="Scout");
 enemy.x=start.x+2;enemy.y=start.y;
 for(const w of foe.units.filter(u=>u.archetype==="Worker"))w.alive=false;
 m.orders={[attacker.id]:{kind:"attack",targetPlayer:"human",targetId:enemy.id,aiIssued:true}};
 assert.deepEqual(planArmyOrders(m,p.id,{stance:"assault"}),[]);
 assert.equal(m.orders[attacker.id].targetId,enemy.id);
 enemy.alive=false;
 planArmyOrders(m,p.id,{stance:"assault"});
 assert.equal(m.orders[attacker.id],undefined);
});
test("spatial resource index excludes exhausted, blocked and unwalkable deposits",()=>{
 const map={width:3,height:2,tiles:[
  {x:0,y:0,resource:"Food",amount:10},
  {x:1,y:0,resource:"Wood",amount:30},
  {x:2,y:0,resource:"Wood",amount:0},
  {x:0,y:1,resource:"Food",amount:50,terrain:"water"},
  {x:1,y:1,resource:"Gold",amount:25,occupied:"site"},
  {x:2,y:1,resource:"Food",amount:20}
 ].map(tile=>({terrain:"grass",occupied:null,...tile}))};
 const sites=viableHarvestSites(map);
 assert.deepEqual(sites.get("Food").map(x=>[x.x,x.y]),[[0,0],[2,1]]);
 assert.equal(sites.get("Wood").length,1);
 assert.equal(sites.has("Gold"),false);
});
test("indexed harvest assignments still use real deposits and spend no resources",()=>{
 const catalog=JSON.parse(readFileSync(new URL("../data/balance-v0.2.json",import.meta.url)));
 const m=createMatch([{id:"human",faction:"Humans"},{id:"ai",faction:"Orcs"}],73);
 attachBattlefield(m,makeMap({width:48,height:48,players:2,seed:73}));
 installFullCatalog(m,catalog);setEconomyMode(m,"spatial");
 const p=m.players[1],initial={...p.resources};
 const assignment=assignSpatialBotWorker(m,p.id);
 assert.ok(assignment);
 assert.ok(viableHarvestSites(m.battlefield).get(assignment.resource)?.some(tile=>
  tile.x===assignment.x&&tile.y===assignment.y));
 assert.deepEqual(p.resources,initial);
});
test("mobile render canvas fits a fixed memory budget and landscape aspect ratio",()=>{
 const mobile=battlefieldRenderSize(2048,1200,1.35,{mobile:true});
 assert.ok(mobile.width<=2048&&mobile.height<=2048);
 assert.ok(mobile.width*mobile.height<=1505000);
 assert.ok(Math.abs(mobile.width/mobile.height-2048/1200)<.005);
 const desktop=battlefieldRenderSize(2048,1200,1.35,{mobile:false});
 assert.ok(desktop.width*desktop.height<=3005000);
 assert.ok(desktop.width>=mobile.width);
 assert.deepEqual(battlefieldRenderSize(0,800,1,{mobile:true}),{width:1,height:1});
 assert.deepEqual(battlefieldRenderSize(NaN,900,1),{width:1,height:1});
});
