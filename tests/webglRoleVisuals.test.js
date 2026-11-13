import test from "node:test";
import assert from "node:assert/strict";
import {unitRoleVisual,healthSegments,terrainSignature} from "../web/webgl3d.js";
test("procedural visual profiles distinguish all major role families",()=>{
 const cases={
  Worker:"pack",Swordsman:"shield",Archer:"ranged",Hero:"banner",
  "Battering Ram":"turret","Heavy Warship":"mast",Interceptor:"wings"
 };
 for(const [archetype,accessory] of Object.entries(cases))
  assert.equal(unitRoleVisual({archetype}).accessory,accessory,archetype);
 assert.ok(unitRoleVisual({archetype:"Hero"}).shoulder>
  unitRoleVisual({archetype:"Worker"}).shoulder);
});
test("health pips clamp, round partial segments upward and handle invalid maximum",()=>{
 assert.deepEqual(healthSegments({hp:100,maxHp:100}),[true,true,true,true,true]);
 assert.deepEqual(healthSegments({hp:25,maxHp:100}),[true,true,false,false,false]);
 assert.deepEqual(healthSegments({hp:0,maxHp:100}),[false,false,false,false,false]);
 assert.deepEqual(healthSegments({hp:500,maxHp:100}),[true,true,true,true,true]);
 assert.equal(healthSegments({hp:2,maxHp:0}).length,5);
});
test("structure occupancy is included in static terrain invalidation",()=>{
 const base={width:2,height:1,tiles:[
  {x:0,y:0,terrain:"grass",occupied:null},
  {x:1,y:0,terrain:"grass",occupied:null}
 ]};
 const changed=structuredClone(base);
 changed.tiles[0].occupied="house-1";
 assert.notEqual(terrainSignature(base),terrainSignature(changed));
});
