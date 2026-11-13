import test from "node:test";
import assert from "node:assert/strict";
import {vehicleMotion,transformVehicleVertex} from "../web/vehicleMotion.js";
test("naval, air and siege motion profiles are distinct and deterministic",()=>{
 for(const role of ["Raft","Bomber","Battering Ram","Heavy Mobile"]){
  const m=vehicleMotion(role,"attack",300,2);
  assert.ok(m);assert.deepEqual(m,vehicleMotion(role,"attack",300,2));
  assert.notDeepEqual(transformVehicleVertex(.3,.8,.1,m),[.3,.8,.1]);
 }
 assert.notDeepEqual(vehicleMotion("Raft","idle",500),vehicleMotion("Bomber","idle",500));
 assert.equal(vehicleMotion("Swordsman","attack",300),null);
 assert.throws(()=>vehicleMotion("Bomber","dance",300),/Invalid/);
 assert.throws(()=>vehicleMotion("Raft","walk",Infinity),/Invalid/);
});
test("motion preserves unmodified coordinates when not a specialized class",()=>{
 assert.deepEqual(transformVehicleVertex(1,2,3,null),[1,2,3]);
 const p=transformVehicleVertex(.7,1,.3,{pitch:0,roll:0,yaw:0,rise:0,recoil:0});
 assert.deepEqual(p,[.7,1,.3]);
});
