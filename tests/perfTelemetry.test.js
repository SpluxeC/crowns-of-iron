import test from "node:test";
import assert from "node:assert/strict";
import {createPerformanceTelemetry,percentile,formatTiming} from "../web/perfTelemetry.js";
test("bounded timing percentiles are stable and use nearest rank",()=>{
 const p=createPerformanceTelemetry({limit:4});
 for(const x of [7,2,12,4,5])assert.equal(p.record("render",x),true);
 assert.deepEqual(p.summary("render"),{count:4,p50:4,p95:12,worst:12});
 assert.match(formatTiming(p.summary("render")),/p50 4.0ms/);
 assert.equal(percentile([],.5),null);
 p.reset();assert.equal(p.summary("render").count,0);
});
test("telemetry rejects malformed samples, never stores secrets or unbounded data",()=>{
 const p=createPerformanceTelemetry({limit:2});
 assert.equal(p.record("network",NaN),false);
 assert.equal(p.record("network",-2),false);
 p.record("network",1);p.record("network",2);p.record("network",3);
 assert.equal(p.summary("network").count,2);
 assert.deepEqual(p.names(),["network"]);
 assert.throws(()=>createPerformanceTelemetry({limit:0}),/sample limit/);
});
