import test from "node:test";
import assert from "node:assert/strict";
import {runArmyRehearsal} from "../src/armyRehearsal.js";
test("eight-player 192-unit coordinated formation orders are deterministic",()=>{
 const first=runArmyRehearsal({seed:260,ticks:2});
 const second=runArmyRehearsal({seed:260,ticks:2});
 assert.deepEqual(first,second);
 assert.equal(first.players,8);
 assert.equal(first.formationUnits,192);
 assert.equal(first.liveUnits,224);
 assert.equal(first.overlaps,0);
 assert.equal(first.version,10);
});
test("rehearsal bounds reject invalid tick budgets",()=>{
 assert.throws(()=>runArmyRehearsal({ticks:0}),/ticks/);
 assert.throws(()=>runArmyRehearsal({ticks:13}),/ticks/);
});
