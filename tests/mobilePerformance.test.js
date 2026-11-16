import test from "node:test";
import assert from "node:assert/strict";
import {createRenderQuality} from "../web/mobilePerformance.js";
test("mobile Auto mode caps resolution and targets 30 fps",()=>{
 const q=createRenderQuality({mobile:true,devicePixelRatio:3});
 assert.equal(q.scale(),1.35);
 assert.equal(q.stats().targetFps,30);
});
test("sustained slow rendering reduces resolution but not below minimum",()=>{
 const q=createRenderQuality({mobile:true,devicePixelRatio:2});
 for(let i=0;i<100;i++)q.observe(42,5000+i*100);
 assert.ok(q.scale()<1.35);
 assert.ok(q.scale()>=.7);
 assert.ok(q.stats().samples>=100);
});
test("sustained fast frames cautiously increase resolution",()=>{
 const q=createRenderQuality({mobile:true,devicePixelRatio:2});
 for(let i=0;i<100;i++)q.observe(43,5000+i*120);
 const lower=q.scale();
 for(let i=0;i<150;i++)q.observe(3,20000+i*160);
 assert.ok(q.scale()>=lower);
 assert.ok(q.scale()<=1.35);
});
test("manual performance and quality profiles are predictable",()=>{
 const q=createRenderQuality({mobile:false,devicePixelRatio:2});
 q.setMode("Performance");assert.equal(q.scale(),.85);
 for(let i=0;i<150;i++)q.observe(60,10000+i*100);
 assert.equal(q.scale(),.85);
 q.setMode("Quality");assert.equal(q.scale(),1.75);
 assert.throws(()=>q.setMode("Very High"),/Invalid graphics mode/);
});
test("quality inputs reject corrupted samples",()=>{
 const q=createRenderQuality({mobile:true,devicePixelRatio:1});
 assert.equal(q.observe(Infinity,10000),false);
 assert.equal(q.observe(-1,10000),false);
 assert.equal(q.stats().samples,0);
});
