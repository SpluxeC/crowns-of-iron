import {runLocalHttpBenchmark} from "../src/localHttpBenchmark.js";
import {unitRoleVisual,healthSegments} from "../web/webgl3d.js";
import {createPerformanceTelemetry} from "../web/perfTelemetry.js";
import {attackOrders,stopOrders} from "../web/combatOrders.js";
import {assert} from "../src/util.js";
const result=await runLocalHttpBenchmark({players:8,rounds:12,seed:709});
assert(result.successfulRequests===96&&result.privateEconomyChecks===96);
assert(unitRoleVisual({archetype:"Archer"}).accessory==="ranged");
assert(healthSegments({hp:30,maxHp:100}).filter(Boolean).length===2);
const unit={id:"a",alive:true,attack:8,x:1,y:1};
assert(attackOrders({units:[unit]},new Set(["a"]),"enemy","target").length===1);
assert(stopOrders({units:[unit]},new Set(["a"])).length===1);
const perf=createPerformanceTelemetry();
perf.record("http",result.responseMs.p50);
assert(perf.summary("http").count===1);
console.log(JSON.stringify({milestones:"6.7–7.0",rendererProfile:"procedural role proxies",
 commands:"atomic group attack/stop",browserMetrics:"bounded CPU submission timings",
 httpBenchmark:result,
 caveat:"Loopback-only HTTP, Node tests and procedural WebGL proxy; no real browser/GPU/WAN validation"},null,2));
