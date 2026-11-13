import test from "node:test";
import assert from "node:assert/strict";
import {runLocalHttpBenchmark} from "../src/localHttpBenchmark.js";
test("real loopback HTTP roundtrips authenticate all players without leaking economy",async()=>{
 const result=await runLocalHttpBenchmark({players:4,rounds:3,seed:19});
 assert.equal(result.successfulRequests,12);
 assert.equal(result.privateEconomyChecks,12);
 assert.equal(result.unauthorizedRejected,true);
 assert.ok(result.responseMs.p95>=0);
 assert.ok(result.responseBytes.p50>100);
 assert.match(result.limitations,/no TLS/);
});
test("local HTTP benchmark requires bounded run parameters",async()=>{
 await assert.rejects(runLocalHttpBenchmark({players:9}),/player count/);
 await assert.rejects(runLocalHttpBenchmark({rounds:0}),/rounds/);
});
