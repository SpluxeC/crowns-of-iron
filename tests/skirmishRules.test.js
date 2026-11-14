import test from "node:test";
import assert from "node:assert/strict";
import {createMatch} from "../src/simulation.js";
import {skirmishScore,applySkirmishVictory,SKIRMISH_LIMIT_MS} from "../web/skirmishRules.js";
const participants=[{id:"human",faction:"Humans"},{id:"ai-1",faction:"Orcs"}];
test("local AI skirmish stays active before the cap",()=>{
 const m=createMatch(participants,712);
 assert.equal(applySkirmishVictory(m),null);
 assert.equal(m.winner,null);
 assert.ok(skirmishScore(m.players[0])>0);
});
test("eliminating all remaining AI units wins a solo skirmish",()=>{
 const m=createMatch(participants,712);
 for(const u of m.players[1].units){u.hp=0;u.alive=false;}
 assert.equal(applySkirmishVictory(m),"human");
 assert.equal(m.players[1].defeated,true);
 assert.equal(applySkirmishVictory(m),"human");
});
test("timed victory compares deterministic army and economy strength",()=>{
 const m=createMatch(participants,712);
 m.elapsedMs=SKIRMISH_LIMIT_MS;
 m.players[0].resources.Food=15000;
 assert.equal(applySkirmishVictory(m),"human");
 const other=createMatch(participants,712);
 other.elapsedMs=SKIRMISH_LIMIT_MS;
 other.players[1].resources.Food=20000;
 assert.equal(applySkirmishVictory(other),"ai-1");
});
test("simultaneous elimination resolves a draw",()=>{
 const m=createMatch(participants,712);
 for(const p of m.players)for(const u of p.units){u.hp=0;u.alive=false;}
 assert.equal(applySkirmishVictory(m),"draw");
});
