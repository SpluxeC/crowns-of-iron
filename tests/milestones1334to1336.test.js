import test from "node:test";
import assert from "node:assert/strict";
import {createMatch} from "../src/state.js";
import {makeMap} from "../src/map.js";
import {attachBattlefield} from "../src/battlefield.js";
import {endangeredWorkerCount,selectSquadObjective} from "../src/botTargeting.js";
import {harvestResourceOptions,uncoveredMandatoryResource} from "../src/spatialBot.js";
import {createRenderQuality} from "../web/mobilePerformance.js";

test("defensive threat risk counts only living positioned allied workers in danger",()=>{
 const enemy={x:10,y:10};
 const workers=[
  {alive:true,archetype:"Worker",x:10,y:11},
  {alive:true,archetype:"Worker",x:13,y:10},
  {alive:false,archetype:"Worker",x:10,y:10},
  {alive:true,archetype:"Scout",x:10,y:10},
  {alive:true,archetype:"Worker",x:15,y:10},
  {alive:true,archetype:"Worker",x:null,y:null}
 ];
 assert.equal(endangeredWorkerCount(enemy,workers),2);
 assert.equal(endangeredWorkerCount(enemy,workers,1),1);
});
test("defenders choose intruder near endangered worker over equally distant base threat",()=>{
 const m=createMatch([{id:"human",faction:"Humans"},{id:"ai",faction:"Orcs"}],109);
 attachBattlefield(m,makeMap({seed:109,width:48,height:48,players:2}));
 const home=m.battlefield.starts[1],guard=m.players[1].units.find(u=>u.archetype==="Scout");
 guard.x=home.x+4;guard.y=home.y;
 const ownWorkers=m.players[1].units.filter(u=>u.archetype==="Worker");
 for(const worker of ownWorkers){worker.x=home.x+8;worker.y=home.y+2;}
 const opponents=m.players[0].units;
 for(const u of opponents)u.alive=false;
 const baseEnemy=opponents.find(u=>u.archetype==="Scout");
 baseEnemy.alive=true;baseEnemy.x=home.x;baseEnemy.y=home.y;
 const raider={...baseEnemy,id:"worker-raider",x:home.x+8,y:home.y,alive:true};
 opponents.push(raider);
 assert.equal(selectSquadObjective(m,"ai","defend",[guard])?.unit.id,raider.id);
});
test("rebalanced harvester only searches the uncovered mandatory shortage",()=>{
 const priority=["Food","Wood","Stone","Gold"];
 const needed=uncoveredMandatoryResource(priority,{Food:300,Wood:100,Stone:80},["Food","Wood"]);
 assert.equal(needed,"Stone");
 assert.deepEqual(harvestResourceOptions(priority,needed),["Stone"]);
 assert.deepEqual(harvestResourceOptions(priority),priority);
 assert.notEqual(harvestResourceOptions(priority),priority);
});
test("mobile resumes at target frame cadence without instantly raising resolution",()=>{
 const q=createRenderQuality({mobile:true,devicePixelRatio:2});
 for(let i=0;i<220;i++)q.observe(80,5000+i*100);
 const low=q.scale();
 assert.ok(low<=1.35&&low>=.7);
 assert.ok(q.stats().targetFps<=30);
 assert.equal(q.observe(10000,60000),false);
 assert.equal(q.stats().samples,1);
 assert.equal(q.stats().averageMs,250);
 assert.equal(q.stats().targetFps,30);
 assert.equal(q.scale(),low);
});
