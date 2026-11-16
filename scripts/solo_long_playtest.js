/** Long-duration headless solo skirmish rehearsal. Real RTS simulation, not browser GPU.
 * Prints machine-readable metrics and asserts population/economy invariants. */
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {performance} from "node:perf_hooks";
import {createMatch,step,checksum} from "../src/simulation.js";
import {makeMap} from "../src/map.js";
import {attachBattlefield} from "../src/battlefield.js";
import {installFullCatalog} from "../src/fullCatalog.js";
import {enableBot} from "../src/ai.js";
import {enableUnitCollision} from "../src/unitCollision.js";
import {setEconomyMode} from "../src/spatialEconomy.js";
import {applySkirmishVictory,skirmishReport,SKIRMISH_LIMIT_MS} from "../web/skirmishRules.js";
const data=JSON.parse(readFileSync(new URL("../data/balance-v0.2.json",import.meta.url)));
const factions=["Humans","Orcs","Dwarfs","Tree Elves","Corrupt Elves","Ursa"];
function setup(seed,enemies){
 const participants=[{id:"human",faction:factions[seed%factions.length]}];
 for(let i=0;i<enemies;i++)participants.push({
  id:"ai-"+(i+1),faction:factions[(seed+i+1)%factions.length]});
 const match=createMatch(participants,seed);
 attachBattlefield(match,makeMap({width:48,height:48,players:participants.length,seed}));
 installFullCatalog(match,data);enableUnitCollision(match);setEconomyMode(match,"spatial");
 for(const p of participants.slice(1))enableBot(match,p.id,enemies>1?"Normal":"Hard");
 return match;
}
function invariant(match){
 assert.ok(match.players[0].id==="human","Human player order changed");
 for(const p of match.players){
  assert.ok(p.popUsed>=0&&p.popCap>=p.popUsed,
   "Invalid population for "+p.id);
  assert.ok(Object.values(p.resources).every(v=>Number.isFinite(v)&&v>=0),
   "Negative/invalid resources for "+p.id);
  for(const u of p.units)if(u.alive)
   assert.ok(Number.isFinite(u.hp)&&u.hp>0,"Alive unit with invalid HP");
 }
}
function simulate(seed,enemies,seconds){
 const game=setup(seed,enemies);
 const started=performance.now();
 let ticks=0,peakStepMs=0;
 while(ticks<seconds&&game.winner===null){
  const begin=performance.now();
  step(game,1000);applySkirmishVictory(game);
  peakStepMs=Math.max(peakStepMs,performance.now()-begin);
  ticks++;
  if(ticks%30===0)invariant(game);
 }
 invariant(game);
 const elapsedRealMs=Math.round(performance.now()-started);
 const overview={seed,enemies,simulatedSeconds:ticks,
  elapsedRealMs,peakStepMs:Math.round(peakStepMs),
  winner:game.winner,
  bots:game.players.slice(1).map(p=>({
   faction:p.faction,age:p.age,
   trained:p.units.length,active:p.units.filter(u=>u.alive).length,
   buildings:Object.values(game.constructions??{}).filter(s=>s.owner===p.id).length,
   techs:p.completed.length,stance:game.bots[p.id].stance??"assault",
   decisions:game.bots[p.id].decisions
  })),checksum:checksum(game)};
 assert.ok(overview.bots.every(b=>b.decisions>=Math.floor(ticks/10)),
  "Bot decision loop stopped unexpectedly");
 assert.ok(overview.bots.some(b=>b.buildings>0),
  "AI never expanded during the long playtest");
 return {game,overview};
}
const first=simulate(713,1,600);
const second=simulate(827,3,420);
const determinism=simulate(713,1,600);
assert.equal(first.overview.checksum,determinism.overview.checksum,
 "Repeat run with matching seed diverged");
assert.equal(first.overview.winner,determinism.overview.winner);
const reportGame=first.game;
if(reportGame.winner===null){
 reportGame.elapsedMs=SKIRMISH_LIMIT_MS;
 applySkirmishVictory(reportGame);
}
const report=skirmishReport(reportGame);
assert.ok(report?.winner!==null&&report?.players.length===2);
assert.equal(reportGame.players[0].id,"human");
const summary={pass:true,headlessOnly:true,
 scenarios:[first.overview,second.overview],
 deterministicReplay:true,forcedEndReportVerified:true};
console.log("SOLO_SOAK_RESULT="+JSON.stringify(summary));
