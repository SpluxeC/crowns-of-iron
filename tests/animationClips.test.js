import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {ANIMATION_CLIPS,sampleAnimationClip} from "../web/animationClips.js";
import {RIG_BONE_NAMES} from "../web/rigProfiles.js";
test("three authored keyframe clips match published JSON and list all seven joints",async()=>{
 const file=JSON.parse(await readFile(new URL("../assets/animations/rig-clips.json",import.meta.url),"utf8"));
 assert.deepEqual(file.bones,RIG_BONE_NAMES);
 assert.deepEqual(file.clips,ANIMATION_CLIPS);
 assert.equal(Object.keys(file.clips).length,3);
 for(const [name,clip] of Object.entries(file.clips)){
  assert.ok(clip.durationMs>100);
  assert.equal(clip.keyframes.at(0).t,0);
  assert.equal(clip.keyframes.at(-1).t,1);
  assert.deepEqual(sampleAnimationClip(name,0).angles,
   sampleAnimationClip(name,clip.durationMs).angles);
 }
});
test("keyframe interpolation creates deterministic distinct walk and combat stances",()=>{
 const idle=sampleAnimationClip("idle",180);
 const walk=sampleAnimationClip("walk",180);
 const attack=sampleAnimationClip("attack",180);
 assert.notDeepEqual(idle.angles,walk.angles);
 assert.notDeepEqual(walk.angles,attack.angles);
 assert.ok(Math.abs(walk.angles.leftArm)>.05);
 assert.throws(()=>sampleAnimationClip("invalid",123),/Invalid/);
 assert.throws(()=>sampleAnimationClip("walk",NaN),/Invalid/);
});
