import test from "node:test";
import assert from "node:assert/strict";
import {shouldRetainBotAttackTarget,planArmyOrders} from "../src/armyAI.js";
import {createMatch} from "../src/state.js";
import {makeMap} from "../src/map.js";
import {attachBattlefield} from "../src/battlefield.js";
import {analyzeFactionProgression} from "../src/factionProgressionDiagnostics.js";

const guard={id:"guard",archetype:"Scout",attack:8,x:10,y:10};
const base={x:10,y:10};
const threat=(id,x,y,archetype="Scout",attack=8)=>({id,x,y,archetype,attack,hp:100});
test("defense releases far-away raid targets while assault retains them",()=>{
 const distant=threat("distant",35,35);
 assert.equal(shouldRetainBotAttackTarget(guard,distant,"defend",[base],base),false);
 assert.equal(shouldRetainBotAttackTarget(guard,distant,"assault",[base],base),true);
 assert.equal(shouldRetainBotAttackTarget(guard,distant,"defend",null,base),false);
});
test("defense retains nearby armed attackers but not workers or illegal air targets",()=>{
 assert.equal(shouldRetainBotAttackTarget(guard,threat("armed",12,10),"defend",[base],base),true);
 assert.equal(shouldRetainBotAttackTarget(guard,threat("worker",11,10,"Worker",4),"defend",[base],base),false);
 assert.equal(shouldRetainBotAttackTarget(guard,threat("air",11,10,"Bomber"),"defend",[base],base),false);
 assert.equal(shouldRetainBotAttackTarget(guard,null,"defend",[base],base),false);
});
const snapshot=(faction,age)=>({faction,age,activeArmy:1,activeWorkers:3,completedTech:1,completedConstruction:0});
test("first observed Age II reports checkpoint bounds, not exact research time",()=>{
 const trials=[{
  left:"Humans",right:"Orcs",ticks:360,checkpoints:[
   {second:120,players:[snapshot("Humans","I"),snapshot("Orcs","II")]},
   {second:240,players:[snapshot("Humans","II"),snapshot("Orcs","II")]},
   {second:360,players:[snapshot("Humans","II"),snapshot("Orcs","II")]}
  ]
 },{
  left:"Orcs",right:"Humans",ticks:120,checkpoints:[
   {second:120,players:[snapshot("Orcs","I"),snapshot("Humans","I")]}
  ]
 }];
 const a=analyzeFactionProgression(trials,["Humans","Orcs"]);
 assert.equal(a.factions[0].fixturesObserved,2);
 assert.equal(a.factions[0].fixturesWithAgeII,1);
 assert.equal(a.factions[0].meanFirstObservedAgeIISeconds,240);
 assert.equal(a.factions[1].meanFirstObservedAgeIISeconds,120);
 assert.deepEqual(analyzeFactionProgression([...trials].reverse(),["Humans","Orcs"]),a);
});
test("zero Age II observations reports null rather than a fabricated time",()=>{
 const rows=analyzeFactionProgression([{
  left:"Humans",right:"Orcs",ticks:120,
  checkpoints:[{second:120,players:[snapshot("Humans","I"),snapshot("Orcs","I")]}]
 }],["Humans","Orcs"]).factions;
 assert.ok(rows.every(r=>r.fixturesWithAgeII===0&&r.meanFirstObservedAgeIISeconds===null));
});

test("defense planner removes an existing attack order after raider leaves base area",()=>{
 const match=createMatch([{id:"human",faction:"Humans"},{id:"ai",faction:"Orcs"}],77);
 attachBattlefield(match,makeMap({width:48,height:48,players:2,seed:77}));
 match.fullCatalog={};
 const defender=match.players[1].units.find(u=>u.archetype==="Scout");
 const raider=match.players[0].units.find(u=>u.archetype==="Scout");
 const away=match.battlefield.starts[0];
 for(const u of match.players[0].units){u.x=away.x;u.y=away.y;}
 match.orders={[defender.id]:{kind:"attack",targetPlayer:"human",targetId:raider.id,aiIssued:true,carryMs:0}};
 const actions=planArmyOrders(match,"ai",{stance:"defend"});
 assert.deepEqual(actions,[]);
 assert.equal(match.orders[defender.id],undefined);
});
