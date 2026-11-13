import test from "node:test";
import assert from "node:assert/strict";
import {runArmyRehearsal} from "../src/armyRehearsal.js";
test("eight-player 384-unit active formation load is deterministic and overlap-free",()=>{
 const first=runArmyRehearsal({seed:260,ticks:4,squads:2});
 const second=runArmyRehearsal({seed:260,ticks:4,squads:2});
 assert.deepEqual(first,second);
 assert.equal(first.players,8);
 assert.equal(first.formationOrders,16);
 assert.equal(first.formationUnits,384);
 assert.equal(first.liveUnits,416);
 assert.equal(first.overlaps,0);
 assert.equal(first.version,20);
});
test("large-army rehearsal rejects invalid squad counts",()=>{
 assert.throws(()=>runArmyRehearsal({squads:0}),/squad/);
 assert.throws(()=>runArmyRehearsal({squads:3}),/squad/);
});
