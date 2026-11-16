import test from "node:test";
import assert from "node:assert/strict";
import {createMatch} from "../src/state.js";
import {attachBattlefield} from "../src/battlefield.js";
import {makeMap} from "../src/map.js";
import {selectSquadObjective} from "../src/botTargeting.js";
import {analyzeFactionProgression} from "../src/factionProgressionDiagnostics.js";

function fixture(){
 const m=createMatch([{id:"human",faction:"Humans"},{id:"ai",faction:"Orcs"}],88);
 attachBattlefield(m,makeMap({width:48,height:48,players:2,seed:88}));
 m.fullCatalog={};return m;
}
test("defensive target is an armed intruder, not a nearer civilian",()=>{
 const m=fixture(),ai=m.players[1],enemy=m.players[0];
 const guard=ai.units.find(u=>u.archetype==="Scout");
 const worker=enemy.units.find(u=>u.archetype==="Worker");
 const attacker=enemy.units.find(u=>u.archetype==="Scout");
 const home=m.battlefield.starts[1];
 guard.x=home.x;guard.y=home.y;
 worker.x=home.x+1;worker.y=home.y;
 attacker.x=home.x+2;attacker.y=home.y;
 assert.equal(selectSquadObjective(m,"ai","defend",[guard])?.unit.id,attacker.id);
 attacker.alive=false;
 assert.equal(selectSquadObjective(m,"ai","defend",[guard]),null);
});
test("objective must be attackable by at least one squad member",()=>{
 const m=fixture(),ai=m.players[1],enemy=m.players[0];
 const guard=ai.units.find(u=>u.archetype==="Scout");
 const scout=enemy.units.find(u=>u.archetype==="Scout");
 const other=enemy.units.find(u=>u.archetype==="Worker");
 scout.archetype="Bomber";other.alive=false;
 assert.equal(selectSquadObjective(m,"ai","assault",[guard]),null);
});
const snapshot=(faction,age,activeArmy,activeWorkers,completedTech,completedConstruction=0)=>
 ({faction,age,activeArmy,activeWorkers,completedTech,completedConstruction});
test("progression diagnostic aggregates mirrored observations by faction, not side",()=>{
 const a={left:"Humans",right:"Orcs",ticks:240,checkpoints:[
  {second:120,players:[snapshot("Humans","I",3,5,1),snapshot("Orcs","II",1,4,2)]},
  {second:240,players:[snapshot("Humans","II",5,6,2),snapshot("Orcs","II",2,5,3)]}
 ]};
 const b={left:"Orcs",right:"Humans",ticks:120,checkpoints:[
  {second:120,players:[snapshot("Orcs","I",4,4,1),snapshot("Humans","I",1,3,0)]}
 ]};
 const out=analyzeFactionProgression([a,b],["Humans","Orcs"]);
 assert.equal(out.factions[0].observations,3);
 assert.equal(out.factions[0].meanArmy,3);
 assert.equal(out.factions[0].highestAgeReached,"II");
 assert.equal(out.timeline.find(x=>x.faction==="Humans"&&x.second===120).samples,2);
 assert.deepEqual(analyzeFactionProgression([b,a],["Humans","Orcs"]),out);
});
test("progression rejects checkpoints with mismatched factions or fabricated times",()=>{
 const bad={left:"Humans",right:"Orcs",ticks:100,checkpoints:[
  {second:120,players:[snapshot("Humans","I",1,1,1),snapshot("Orcs","I",1,1,1)]}
 ]};
 assert.throws(()=>analyzeFactionProgression([bad],["Humans","Orcs"]),/Invalid progression/);
 bad.ticks=120;bad.checkpoints[0].players[1].faction="Humans";
 assert.throws(()=>analyzeFactionProgression([bad],["Humans","Orcs"]),/Malformed progression/);
});
