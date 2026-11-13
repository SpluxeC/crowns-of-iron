import test from "node:test";
import assert from "node:assert/strict";
import {applyDamageFinish,damageProfile} from "../web/damageFinish.js";
import {factionCombatVfx} from "../web/factionCombatVfx.js";
import {combatVfxDescriptor,appendCombatVfx} from "../web/combatVfx.js";
import {createArtFrameBudget,ART_BUDGETS} from "../web/artFrameBudget.js";
import {FACTION_SLUGS} from "../web/factionArt.js";
const mesh=()=>({vertices:new Float32Array(Array.from({length:180},(_,i)=>
 i%6<3?i/100:.75)),uvs:new Float32Array(60),vertexCount:30,textured:true});
test("damage materials distinguish domains and six factions without moving geometry",()=>{
 const base=mesh(),copy=new Float32Array(base.vertices);
 assert.equal(applyDamageFinish(base,100,100),base);
 for(const domain of ["humanoid","siege","naval","air"]){
  const palettes=new Set();
  for(const faction of FACTION_SLUGS){
   const a=applyDamageFinish(base,25,100,{domain,faction,seed:7});
   assert.equal(a.vertexCount,base.vertexCount);
   assert.equal(a.uvs,base.uvs);
   assert.equal(a.damageFinish,.75);
   assert(a.vertices.every(Number.isFinite));
   for(let i=0;i<copy.length;i+=6)
    assert.deepEqual(Array.from(a.vertices.slice(i,i+3)),Array.from(copy.slice(i,i+3)));
   palettes.add(Array.from(a.vertices.slice(3,6)).join(","));
   assert.deepEqual(a.vertices,applyDamageFinish(base,25,100,{domain,faction,seed:7}).vertices);
  }
  assert.equal(palettes.size,6);
 }
 assert.deepEqual(base.vertices,copy);
 assert.notDeepEqual(damageProfile("air","Humans"),damageProfile("naval","Humans"));
 assert.throws(()=>damageProfile("unknown","Humans"),/Unknown/);
 assert.throws(()=>applyDamageFinish(base,40,100,{seed:-1}),/Invalid/);
});
test("all faction attack and death cues remain bounded and preserve timing",()=>{
 const model={id:"x"};
 const colors=new Set();
 for(const faction of FACTION_SLUGS){
  const shot=factionCombatVfx(combatVfxDescriptor(model,{clip:"attack",preview:true},25),
   faction,"Bomber");
  const death=factionCombatVfx(combatVfxDescriptor(model,{death:.5},25),
   faction,"Heavy Warship");
  colors.add(shot.color);
  assert.notEqual(shot.color,death.color);
  const out=[];assert.equal(appendCombatVfx(out,0,0,0,shot),24);
  assert.equal(out.length,144);assert(out.every(Number.isFinite));
  assert.equal(factionCombatVfx(null,faction,"Bomber"),null);
 }
 assert.equal(colors.size,6);
 assert.throws(()=>factionCombatVfx({kind:"muzzle"},"not-a-faction","Bomber"),/Invalid/);
});
test("frame budgets enforce finite per-draw costs and validate override requests",()=>{
 const budget=createArtFrameBudget({damageFinishes:2,combatBursts:1});
 assert.equal(budget.claim("damageFinishes"),true);
 assert.equal(budget.claim("damageFinishes"),true);
 assert.equal(budget.claim("damageFinishes"),false);
 assert.equal(budget.claim("combatBursts"),true);
 assert.equal(budget.claim("combatBursts"),false);
 assert.equal(budget.stats().burstVerticesUpperBound,24);
 assert.equal(ART_BUDGETS.detailedUnits,160);
 assert.throws(()=>budget.claim("invalid"),/Invalid/);
 assert.throws(()=>createArtFrameBudget({combatBursts:-2}),/Invalid/);
 assert.throws(()=>createArtFrameBudget({unknown:1}),/Invalid/);
});
