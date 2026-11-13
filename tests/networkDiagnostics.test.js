import test from "node:test";
import assert from "node:assert/strict";
import {runLocalHostStress} from "../src/networkDiagnostics.js";
test("8-player 2400-population local stress fixture executes deterministic ticks and snapshots",()=>{
 const a=runLocalHostStress({seed:40,players:8,population:300,ticks:2});
 const b=runLocalHostStress({seed:40,players:8,population:300,ticks:2});
 assert.equal(a.totalUnits,2400);
 assert.equal(a.serverVersion,2);
 assert.equal(a.finalChecksum,b.finalChecksum);
 assert.equal(a.clientChecksum,b.clientChecksum);
});
test("stress fixture refuses invalid population and participant bounds",()=>{
 assert.throws(()=>runLocalHostStress({players:9}),/player count/);
 assert.throws(()=>runLocalHostStress({population:301}),/population cap/);
});
