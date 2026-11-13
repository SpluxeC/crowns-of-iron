import test from "node:test";
import assert from "node:assert/strict";
import {poseAt,deformVertex,animationModeForUnit,ANIMATION_MODES} from "../web/meshAnimation.js";
test("procedural animation clips are bounded deterministic and differ by state",()=>{
 assert.deepEqual(ANIMATION_MODES,["idle","walk","attack"]);
 assert.deepEqual(poseAt("walk",345),poseAt("walk",345));
 assert.notDeepEqual(poseAt("idle",345),poseAt("attack",345));
 assert.notDeepEqual(deformVertex(.3,.4,.2,poseAt("walk",345)),[.3,.4,.2]);
 assert.throws(()=>poseAt("dance",10),/Unsupported/);
 assert.throws(()=>poseAt("idle",Infinity),/Invalid/);
});
test("order kind drives clip without trusting remote animation input",()=>{
 const u={alive:true};
 assert.equal(animationModeForUnit(u,{kind:"move",path:[{x:1,y:2}]}),"walk");
 assert.equal(animationModeForUnit(u,{kind:"attackMove",engaged:{targetId:"enemy"}}),"attack");
 assert.equal(animationModeForUnit(u,{kind:"attack"}),"attack");
 assert.equal(animationModeForUnit(u,{kind:"move",path:[]}),"idle");
 assert.equal(animationModeForUnit({alive:false},{kind:"attack"}),"idle");
});
