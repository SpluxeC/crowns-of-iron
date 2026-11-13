import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {RIG_BONE_NAMES,RIG_PROFILES,rigForFaction,boneForPosition,
 rotateAroundJointX} from "../web/rigProfiles.js";
test("six faction-specific seven-bone procedural rig profiles match committed artist data",async()=>{
 const stored=JSON.parse(await readFile(new URL("../assets/rigs/faction-rigs.json",import.meta.url),"utf8"));
 assert.deepEqual(stored.bones,RIG_BONE_NAMES);
 assert.deepEqual(stored.factions,RIG_PROFILES);
 assert.equal(Object.keys(RIG_PROFILES).length,6);
 assert.notDeepEqual(rigForFaction("Ursa"),rigForFaction("Tree Elves"));
 assert.equal(rigForFaction("unknown"),null);
});
test("body regions choose deterministic leg/arm/head pivots and rotate around joints",()=>{
 const rig=rigForFaction("Humans");
 assert.equal(boneForPosition(-.4,.45,1.5,rig),"leftArm");
 assert.equal(boneForPosition(.4,.45,1.5,rig),"rightArm");
 assert.equal(boneForPosition(-.2,.10,1.5,rig),"leftLeg");
 assert.equal(boneForPosition(.0,1.4,1.5,rig),"head");
 assert.notDeepEqual(rotateAroundJointX(.5,.2,.4,.3),[.5,.2]);
});
