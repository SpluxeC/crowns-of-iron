import test from "node:test";
import assert from "node:assert/strict";
import {selectReachableBotTarget} from "../src/armyAI.js";
import {analyzeFactionProgression} from "../src/factionProgressionDiagnostics.js";

test("path search finds reachable target after the previous eight-entry limit",()=>{
 const targets=Array.from({length:16},(_,i)=>({id:"enemy-"+i}));
 let attempts=0;
 const chosen=selectReachableBotTarget(targets,t=>{
  attempts++;return t.id==="enemy-9";
 });
 assert.equal(chosen.id,"enemy-9");
 assert.equal(attempts,10);
});
test("pathfinding budget never exhaustively scans arbitrarily large candidate lists",()=>{
 const targets=Array.from({length:40},(_,i)=>i);
 let probes=0;
 assert.equal(selectReachableBotTarget(targets,()=>{probes++;return false;}),null);
 assert.equal(probes,16);
 assert.equal(selectReachableBotTarget(targets,n=>n===17,20),17);
 assert.throws(()=>selectReachableBotTarget(targets,()=>true,0),/budget/);
 assert.throws(()=>selectReachableBotTarget(targets,()=>true,33),/budget/);
});
const p=(faction,age)=>({faction,age,activeArmy:1,activeWorkers:2,
 completedTech:1,completedConstruction:0});
test("Age III reporting counts fixtures with first checkpoint and null for no progress",()=>{
 const fixtures=[{left:"Humans",right:"Orcs",ticks:360,checkpoints:[
  {second:120,players:[p("Humans","I"),p("Orcs","II")]},
  {second:240,players:[p("Humans","II"),p("Orcs","III")]},
  {second:360,players:[p("Humans","III"),p("Orcs","III")]}
 ]},{left:"Orcs",right:"Humans",ticks:120,checkpoints:[
  {second:120,players:[p("Orcs","I"),p("Humans","I")]}
 ]}];
 const report=analyzeFactionProgression(fixtures,["Humans","Orcs"]);
 assert.equal(report.factions[0].fixturesWithAgeIII,1);
 assert.equal(report.factions[0].meanFirstObservedAgeIIISeconds,360);
 assert.equal(report.factions[1].meanFirstObservedAgeIIISeconds,240);
 assert.deepEqual(analyzeFactionProgression([...fixtures].reverse(),["Humans","Orcs"]),report);
 const none=analyzeFactionProgression([fixtures[1]],["Humans","Orcs"]);
 assert.ok(none.factions.every(row=>row.meanFirstObservedAgeIIISeconds===null));
});
