import test from "node:test";
import assert from "node:assert/strict";
import {wearLevel,applyBattleWear} from "../web/battleWear.js";
import {combatVfxDescriptor,appendCombatVfx,COMBAT_VFX_LIMIT} from "../web/combatVfx.js";
import {visibleCombatUnits} from "../web/combatVisuals.js";
const mesh=()=>({vertices:new Float32Array(Array.from({length:54},(_,i)=>
 i%6<3?i/100:.8))});
test("battle wear follows bounded HP and retains geometry and source",()=>{
 const m=mesh(),source=new Float32Array(m.vertices);
 assert.equal(wearLevel(100,100),0);
 assert.equal(wearLevel(0,100),1);
 assert.equal(wearLevel(-10,100),1);
 assert.equal(applyBattleWear(m,100,100),m);
 const mid=applyBattleWear(m,50,100,{seed:4});
 const severe=applyBattleWear(m,5,100,{seed:4});
 assert.deepEqual(m.vertices,source);
 assert.equal(mid.battleWear,.5);
 assert.ok(severe.vertices[3]<=source[3]);
 assert.ok(mid.vertices.every(Number.isFinite));
 for(let i=0;i<source.length;i+=6)
  assert.deepEqual(Array.from(mid.vertices.slice(i,i+3)),
   Array.from(source.slice(i,i+3)));
 assert.deepEqual(applyBattleWear(m,50,100,{seed:4}).vertices,mid.vertices);
 assert.throws(()=>wearLevel(4,0),/Invalid/);
 assert.throws(()=>applyBattleWear(m,50,100,{seed:-1}),/Invalid/);
});
test("combat flashes are short bounded geometry bursts, not persistent particles",()=>{
 const unit={id:"x",hp:60,maxHp:100,alive:true};
 assert.equal(combatVfxDescriptor(unit,{clip:"idle"},0),null);
 assert.equal(combatVfxDescriptor(unit,{clip:"attack"},130),null);
 const fired=combatVfxDescriptor(unit,{clip:"attack"},10);
 const hit=combatVfxDescriptor(unit,{hit:1},10);
 const death=combatVfxDescriptor(unit,{death:.5},10);
 assert.equal(fired.kind,"muzzle");
 assert.equal(hit.kind,"hit");
 assert.equal(death.kind,"death");
 assert.equal(COMBAT_VFX_LIMIT,160);
 for(const flash of [fired,hit,death]){
  const vertices=[];
  assert.equal(appendCombatVfx(vertices,2,1,3,flash),24);
  assert.equal(vertices.length,24*6);
  assert.ok(vertices.every(Number.isFinite));
 }
 assert.throws(()=>combatVfxDescriptor(unit,{hit:3},10),/Invalid/);
});
test("filtered snapshots remain the only source of entities for visual events",()=>{
 const state=new Map(),visible=[{id:"self",units:[
  {id:"one",alive:true,hp:75,maxHp:100,x:2,y:3}]}];
 assert.equal(visibleCombatUnits(visible,state,10).length,1);
 visible[0].units=[];
 assert.equal(visibleCombatUnits(visible,state,20).length,0);
 assert.equal(state.size,0);
});
