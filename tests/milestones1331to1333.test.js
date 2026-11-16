import test from "node:test";
import assert from "node:assert/strict";
import {createMatch} from "../src/state.js";
import {makeMap} from "../src/map.js";
import {attachBattlefield} from "../src/battlefield.js";
import {selectSquadObjective} from "../src/botTargeting.js";
import {uncoveredMandatoryResource} from "../src/spatialBot.js";
import {createRenderQuality} from "../web/mobilePerformance.js";

test("mixed squad prefers a widely engageable land threat over an equally near bomber",()=>{
 const m=createMatch([{id:"human",faction:"Humans"},{id:"ai",faction:"Orcs"}],88);
 attachBattlefield(m,makeMap({seed:88,width:48,height:48,players:2}));
 const own=m.players[1],foe=m.players[0];
 const start=m.battlefield.starts[1],scout=own.units.find(u=>u.archetype==="Scout");
 scout.x=start.x;scout.y=start.y;
 const scout2={...scout,id:"added-scout"};
 const antiAir={...scout,id:"added-aa",archetype:"Anti-Air Infantry"};
 const land=foe.units.find(u=>u.archetype==="Scout");
 land.x=start.x+4;land.y=start.y;land.hp=100;
 for(const u of foe.units.filter(u=>u.archetype==="Worker"))u.alive=false;
 const bomber={...land,id:"air-threat",archetype:"Bomber"};
 foe.units.push(bomber);
 const choice=selectSquadObjective(m,"ai","assault",[scout,scout2,antiAir]);
 assert.equal(choice?.unit.id,land.id);
});
test("mandatory worker coverage searches all shortages rather than only first shortage",()=>{
 const priorities=["Food","Wood","Gold","Metal"];
 assert.equal(uncoveredMandatoryResource(priorities,
  {Food:100,Wood:90,Gold:50},["Food"]),"Wood");
 assert.equal(uncoveredMandatoryResource(priorities,
  {Food:100,Wood:90,Gold:50},["Food","Wood"]),"Gold");
 assert.equal(uncoveredMandatoryResource(priorities,
  {Food:100,Wood:90},["Food","Wood"]),null);
 assert.equal(uncoveredMandatoryResource(priorities,{},[]),null);
});
test("mobile quality telemetry resets on return from a long suspended tab",()=>{
 const q=createRenderQuality({mobile:true,devicePixelRatio:2});
 for(let i=0;i<15;i++)q.observe(36,5000+i*100);
 assert.equal(q.stats().samples,15);
 assert.equal(q.observe(6,30000),false);
 assert.equal(q.stats().samples,1);
 assert.equal(q.stats().averageMs,6);
 assert.equal(q.observe(45,30000),false);
 assert.equal(q.stats().samples,1);
 assert.equal(q.observe(45,29999),false);
 assert.equal(q.stats().samples,1);
});
