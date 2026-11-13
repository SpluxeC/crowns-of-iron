import test from "node:test";
import assert from "node:assert/strict";
import {trackCombatVisual,combatVisualPose,applyCombatPose,visibleCombatUnits,
 HIT_FLASH_MS,DEATH_POSE_MS} from "../web/combatVisuals.js";
test("damaged and dying units have bounded cosmetic poses",()=>{
 const first=trackCombatVisual(null,{hp:100,alive:true},0);
 const hit=trackCombatVisual(first,{hp:50,alive:true},100);
 assert.ok(combatVisualPose(hit,110).hit>0);
 assert.equal(combatVisualPose(hit,100+HIT_FLASH_MS).hit,0);
 const dead=trackCombatVisual(hit,{hp:0,alive:false},200);
 assert.ok(combatVisualPose(dead,400).death>0);
 assert.equal(combatVisualPose(dead,200+DEATH_POSE_MS).finished,true);
 const mesh={vertices:new Float32Array([.3,.9,.1,.1,.4,.6])};
 assert.notDeepEqual(applyCombatPose(mesh,{hit:1,death:.5}).vertices,mesh.vertices);
 assert.equal(applyCombatPose(mesh),mesh);
 assert.throws(()=>applyCombatPose(mesh,{hit:2}),/Invalid/);
});
test("hidden or missing units cannot leave lingering death echoes",()=>{
 const states=new Map(),unit={id:"a",hp:100,alive:true,x:1,y:1};
 const players=[{id:"p",units:[unit]}];
 assert.equal(visibleCombatUnits(players,states,10).length,1);
 unit.alive=false;unit.hp=0;
 assert.equal(visibleCombatUnits(players,states,20).length,1);
 assert.equal(visibleCombatUnits(players,states,20+DEATH_POSE_MS).length,0);
 players[0].units=[];assert.equal(visibleCombatUnits(players,states,1000).length,0);
 assert.equal(states.size,0);
});
