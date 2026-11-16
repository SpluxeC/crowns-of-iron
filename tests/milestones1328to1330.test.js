import test from "node:test";
import assert from "node:assert/strict";
import {nextBotSquadFocus} from "../src/armyAI.js";
import {botRecruitmentPlan} from "../src/botRecruitment.js";
import {PRODUCTION_LOCATIONS} from "../src/production.js";
import {createRenderQuality} from "../web/mobilePerformance.js";

test("coordinated military focus moves only after a real reachable target is found",()=>{
 assert.equal(nextBotSquadFocus("unreachable",null),"unreachable");
 assert.equal(nextBotSquadFocus("unreachable",{id:"reachable"}),"reachable");
 assert.equal(nextBotSquadFocus(null,null),null);
});
test("late-age AI considers genuine siege, factory and aerial production",()=>{
 const iii=botRecruitmentPlan("III"),iv=botRecruitmentPlan("IV"),v=botRecruitmentPlan("V");
 assert.ok(iii.includes("Heavy Artillery"));
 assert.ok(iv.includes("Interceptor"));
 assert.ok(v.includes("Heavy War Machine"));
 assert.ok(v.includes("Gunship"));
 assert.ok(PRODUCTION_LOCATIONS["Heavy Artillery"].includes("Siege Workshop"));
 assert.ok(PRODUCTION_LOCATIONS.Interceptor.includes("Airship Hangar"));
 assert.ok(PRODUCTION_LOCATIONS["Heavy War Machine"].includes("Grand Factory"));
 assert.ok(PRODUCTION_LOCATIONS.Gunship.includes("Airship Hangar"));
 assert.deepEqual(botRecruitmentPlan("I"),botRecruitmentPlan("unexpected"));
});
test("render policy retains valid scale if mobile WebView reports corrupt DPR",()=>{
 for(const dpr of [0,-1,NaN,Infinity]){
  const q=createRenderQuality({mobile:true,devicePixelRatio:dpr});
  assert.ok(Number.isFinite(q.scale())&&q.scale()>0);
  assert.equal(q.stats().targetFps,30);
 }
});
test("out-of-order rendering observations cannot corrupt frame adaptation",()=>{
 const q=createRenderQuality({mobile:true,devicePixelRatio:2});
 assert.equal(q.observe(15,1000),false);
 assert.equal(q.observe(100,500),false);
 assert.equal(q.stats().samples,1);
 for(let i=0;i<80;i++)q.observe(50,5000+i*120);
 assert.ok(q.scale()>=.7&&q.scale()<=1.35);
 q.setMode("Auto");
 assert.equal(q.observe(10,200),false);
 assert.equal(q.stats().samples,1);
});
