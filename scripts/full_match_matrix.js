/** Real full-duration headless AI-vs-AI skirmishes, ending by elimination
 * or the actual 30-minute score cap; never jumps the clock to claim a win. */
import assert from "node:assert/strict";
import {performance} from "node:perf_hooks";
import {readFileSync} from "node:fs";
import {createMatch,step,checksum} from "../src/simulation.js";
import {makeMap} from "../src/map.js";
import {attachBattlefield} from "../src/battlefield.js";
import {installFullCatalog} from "../src/fullCatalog.js";
import {enableUnitCollision} from "../src/unitCollision.js";
import {setEconomyMode} from "../src/spatialEconomy.js";
import {enableBot} from "../src/ai.js";
import {applySkirmishVictory,skirmishReport,SKIRMISH_LIMIT_MS} from "../web/skirmishRules.js";
const balance=JSON.parse(readFileSync(new URL("../data/balance-v0.2.json",import.meta.url)));
const factions=["Humans","Orcs","Dwarfs","Tree Elves","Corrupt Elves","Ursa"];
const AGE_RANK={I:1,II:2,III:3,IV:4,V:5};
function setup(seed,count,offset){
 const participants=Array.from({length:count},(_,i)=>({
  id:i?"ai-"+i:"human",faction:factions[(offset+i)%factions.length]}));
 const game=createMatch(participants,seed);
 attachBattlefield(game,makeMap({seed,players:count,width:48,height:48}));
 installFullCatalog(game,balance);
 enableUnitCollision(game);setEconomyMode(game,"spatial");
 // Human is computer-driven ONLY inside this reproducible offline test.
 for(const p of participants)enableBot(game,p.id,"Normal");
 return game;
}
function assertInvariants(game){
 assert.equal(game.players[0].id,"human");
 for(const p of game.players){
  assert.ok(p.popUsed>=0&&p.popUsed<=p.popCap,"Invalid population "+p.id);
  assert.ok(Object.values(p.resources).every(v=>Number.isFinite(v)&&v>=0),
   "Invalid resources "+p.id);
  for(const u of p.units.filter(u=>u.alive))
   assert.ok(Number.isFinite(u.hp)&&u.hp>0,"Invalid alive unit health");
 }
}
function run(seed,count,offset){
 const game=setup(seed,count,offset),start=performance.now();
 const reachedII=new Set(),ages={},sample=[];
 let ticks=0;
 while(game.winner===null&&ticks<SKIRMISH_LIMIT_MS/1000){
  step(game,1000);applySkirmishVictory(game);
  ticks++;
  for(const p of game.players)if(AGE_RANK[p.age]>=2)reachedII.add(p.id);
  if(ticks%60===0){
   assertInvariants(game);
   sample.push({minute:ticks/60,ages:game.players.map(p=>p.age),
    units:game.players.map(p=>p.units.filter(u=>u.alive).length)});
  }
 }
 assertInvariants(game);
 assert.ok(game.winner!==null,"Full match did not resolve at the time limit");
 assert.ok(ticks<=1800&&ticks>0);
 const result=skirmishReport(game);
 assert.ok(result&&result.winner===game.winner);
 assert.equal(result.players.length,count);
 assert.equal(game.players[0].id,"human");
 assert.equal(result.reason,ticks>=1800?"time limit":"elimination");
 return {result:{seed,count,offset,seconds:ticks,winner:game.winner,
  reason:result.reason,ageIIPlayers:[...reachedII].sort(),
  highestAge:Math.max(...game.players.map(p=>AGE_RANK[p.age])),
  completedTech:game.players.map(p=>p.completed.length),
  built:game.players.map(p=>Object.values(game.constructions??{})
   .filter(j=>j.owner===p.id&&j.completed).length),
  executionMs:Math.round(performance.now()-start),
  checkpoints:sample},checksum:checksum(game)};
}
const matches=[];
for(let i=0;i<factions.length;i++)matches.push(run(1301+i*37,2,i).result);
matches.push(run(1901,4,2).result);
const deterministic=run(1301,2,0);
assert.equal(deterministic.checksum,run(1301,2,0).checksum,
 "Same-seed complete game diverged");
assert.deepEqual(
 {...deterministic.result,executionMs:0},
 {...matches[0],executionMs:0},
 "Repeated complete game statistics diverged");
const progressCount=matches.filter(m=>m.ageIIPlayers.length>0).length;
const summary={pass:true,headlessOnly:true,
 fullGames:matches.length,ageIIProgressMatches:progressCount,
 deterministicCompleteGame:true,matches};
console.log("FULL_MATCH_MATRIX_RESULT="+JSON.stringify(summary));
