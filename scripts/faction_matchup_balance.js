/** Reproducible mirrored faction matchup diagnostics, not a proof of balance.
 * Full catalog, collisions, harvesting and AI; no combat modifiers applied. */
import assert from "node:assert/strict";
import {analyzeMirroredMatchups} from "../src/mirroredMatchupDiagnostics.js";
import {analyzeFactionProgression} from "../src/factionProgressionDiagnostics.js";
import {readFileSync} from "node:fs";
import {createMatch,step} from "../src/simulation.js";
import {makeMap} from "../src/map.js";
import {attachBattlefield} from "../src/battlefield.js";
import {installFullCatalog} from "../src/fullCatalog.js";
import {enableUnitCollision} from "../src/unitCollision.js";
import {setEconomyMode} from "../src/spatialEconomy.js";
import {enableBot} from "../src/ai.js";
import {applySkirmishVictory,skirmishScore} from "../web/skirmishRules.js";
const catalog=JSON.parse(readFileSync(new URL("../data/balance-v0.2.json",import.meta.url)));
const factions=["Humans","Orcs","Dwarfs","Tree Elves","Corrupt Elves","Ursa"];
const seconds=480;
function trial(left,right,seed){
 const participants=[{id:"left",faction:left},{id:"right",faction:right}];
 const match=createMatch(participants,seed);
 attachBattlefield(match,makeMap({seed,width:48,height:48,players:2}));
 installFullCatalog(match,catalog);enableUnitCollision(match);
 setEconomyMode(match,"spatial");
 for(const p of participants)enableBot(match,p.id,"Normal");
 let ticks=0;
 const checkpoints=[];
 while(match.winner===null&&ticks<seconds){
  step(match,1000);applySkirmishVictory(match);ticks++;
  if(ticks%120===0){
   checkpoints.push({second:ticks,players:match.players.map(p=>({
    faction:p.faction,age:p.age,activeArmy:p.units.filter(u=>u.alive&&u.attack>0&&u.archetype!=="Worker").length,
    activeWorkers:p.units.filter(u=>u.alive&&u.archetype==="Worker").length,
    completedTech:p.completed.length,
    completedConstruction:Object.values(match.constructions??{}).filter(job=>job.owner===p.id&&job.completed).length
   }))});
  }
 }
 const scores=match.players.map(p=>skirmishScore(p));
 assert.ok(scores.every(Number.isFinite));
 assert.ok(match.players.every(p=>Object.values(p.resources)
  .every(v=>Number.isFinite(v)&&v>=0)));
 const actualWinner=match.winner===null?null:
  match.players.find(p=>p.id===match.winner)?.faction??null;
 return {left,right,seed,ticks,actualWinner,
  unresolved:match.winner===null,
  leader:match.winner===null?(scores[0]===scores[1]?"tie":
   scores[0]>scores[1]?left:right):actualWinner,
  scores,ages:match.players.map(p=>p.age),checkpoints};
}
const trials=[];
for(let a=0;a<factions.length;a++)for(let b=a+1;b<factions.length;b++){
 const seed=3100+a*53+b*101;
 trials.push(trial(factions[a],factions[b],seed));
 trials.push(trial(factions[b],factions[a],seed));
}
assert.equal(trials.length,30);
const report=factions.map(faction=>{
 const appearances=trials.filter(t=>t.left===faction||t.right===faction);
 return {faction,games:appearances.length,
  resolvedWins:appearances.filter(t=>t.actualWinner===faction).length,
  unresolved:appearances.filter(t=>t.unresolved).length,
  scoreLeads:appearances.filter(t=>t.leader===faction).length,
  reachedII:appearances.filter(t=>(t.left===faction?t.ages[0]:t.ages[1])!=="I").length};
});
const diagnostics=analyzeMirroredMatchups(trials,factions);
const progression=analyzeFactionProgression(trials,factions);
const resolved=trials.filter(t=>!t.unresolved).length;
assert.equal(diagnostics.resolved,resolved);
assert.equal(diagnostics.mirroredPairs,15);
assert.equal(progression.factions.length,6);
assert.ok(progression.factions.every(r=>r.observations>0));
assert.ok(trials.every(t=>t.ticks>0&&t.ticks<=seconds));
assert.ok(trials.every(t=>t.checkpoints.every((c,i)=>c.second===(i+1)*120&&
 c.players.length===2&&c.players.every(p=>
  p.activeArmy>=0&&p.activeWorkers>=0&&p.completedTech>=0&&p.completedConstruction>=0))),
 "Invalid faction progression checkpoint");
assert.ok(report.every(r=>r.games===10));
console.log("FACTION_BALANCE_RESULT="+JSON.stringify({
 pass:true,headlessOnly:true,fullCatalog:true,
 mirroredPairs:15,trials:30,horizonSeconds:seconds,resolved,
 factionSummary:report,sideDiagnostics:diagnostics,progression,fixtures:trials
}));
