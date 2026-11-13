import test from "node:test";
import assert from "node:assert/strict";
import {runLargeArmyMovementProfile} from "../src/largeArmyMovementProfile.js";
test("2,400-unit collision-enabled local profile issues 64 moving orders without overlaps",()=>{
 const x=runLargeArmyMovementProfile({seed:731,ticks:2});
 assert.equal(x.totalUnits,2400);
 assert.equal(x.issuedAttackMoveOrders,64);
 assert.equal(x.overlaps,0);
 assert.ok(x.movedUnits>0);
 assert.ok(x.tickMs.p95>=0);
 assert.match(x.scope,/no GPU/);
});
test("large-army profiler bounds tick inputs",()=>{
 assert.throws(()=>runLargeArmyMovementProfile({ticks:0}),/tick count/);
});
