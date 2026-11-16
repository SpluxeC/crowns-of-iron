import test from "node:test";
import assert from "node:assert/strict";
import {createMatch,step,checksum} from "../src/simulation.js";
import {makeMap} from "../src/map.js";
import {attachBattlefield} from "../src/battlefield.js";
import {setEconomyMode} from "../src/spatialEconomy.js";
import {enableBot} from "../src/ai.js";
import {installFullCatalog} from "../src/fullCatalog.js";
import {applySkirmishVictory,skirmishReport,SKIRMISH_LIMIT_MS} from "../web/skirmishRules.js";
import {readFileSync} from "node:fs";
const catalog=JSON.parse(readFileSync(new URL("../data/balance-v0.2.json",import.meta.url)));
const factions=["Humans","Orcs","Dwarfs","Tree Elves","Corrupt Elves","Ursa"];
function setup(seed=713,players=2){
 const participants=Array.from({length:players},(_,i)=>({
  id:i?"ai-"+i:"human",faction:factions[i]}));
 const m=createMatch(participants,seed);
 attachBattlefield(m,makeMap({seed,width:48,height:48,players}));
 installFullCatalog(m,catalog);setEconomyMode(m,"spatial");
 for(const p of participants.slice(1))enableBot(m,p.id,"Normal");
 return m;
}
test("all six factions start clean and remain valid for 60 game seconds",()=>{
 for(let i=0;i<factions.length;i++){
  const m=setup(713+i,2);
  m.players[0].faction=factions[i];
  for(let j=0;j<60;j++){if(m.winner!==null)break;step(m,1000);applySkirmishVictory(m);}
  assert.ok(m.elapsedMs>=1000&&m.elapsedMs<=60000);
  assert.equal(m.players[0].id,"human");
  for(const p of m.players){
   assert.ok(p.popUsed>=0&&p.popUsed<=p.popCap);
   assert.ok(Object.values(p.resources).every(n=>Number.isFinite(n)&&n>=0));
  }
 }
});
test("time-limit report is read-only, ordered and records winner",()=>{
 const m=setup();
 const beforeIds=m.players.map(p=>p.id);
 assert.equal(skirmishReport(m),null);
 m.elapsedMs=SKIRMISH_LIMIT_MS;
 const winner=applySkirmishVictory(m);
 const result=skirmishReport(m);
 assert.ok(result&&result.winner===winner);
 assert.equal(result.reason,"time limit");
 assert.deepEqual(m.players.map(p=>p.id),beforeIds);
 assert.ok(result.players[0].score>=result.players[1].score);
 assert.ok(result.players.every(p=>p.units>=0&&p.researched>=0));
 assert.equal(m.players[0].id,"human");
});
test("solo AI matches replay deterministically across economic and tactical decisions",()=>{
 const a=setup(919),b=setup(919);
 for(let i=0;i<180;i++){
  if(a.winner===null){step(a,1000);applySkirmishVictory(a);}
  if(b.winner===null){step(b,1000);applySkirmishVictory(b);}
 }
 assert.equal(checksum(a),checksum(b));
 assert.ok(a.players[1].units.length>=4);
 assert.ok(Object.values(a.constructions??{}).some(s=>s.owner==="ai-1"));
});
