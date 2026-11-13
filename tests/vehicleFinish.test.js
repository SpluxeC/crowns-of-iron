import test from "node:test";
import assert from "node:assert/strict";
import {VEHICLE_FINISH,finishVehicleComponent,finishVehicleAssembly} from "../web/vehicleFinish.js";
const component=()=>({positions:[0,0,0,1,0,0,0,1,0],
 colors:[.6,.6,.6,1,.4,.4,.4,1,.8,.8,.8,1],uvs:[0,0,1,0,0,1]});
test("all six vehicle finishes are bounded and visually distinct",()=>{
 const names=Object.keys(VEHICLE_FINISH);
 assert.equal(names.length,6);
 const tints=[];
 for(const faction of names){
  const part=component(),positions=[...part.positions],uvs=[...part.uvs];
  finishVehicleComponent(part,faction,"metal");
  assert.deepEqual(part.positions,positions);
  assert.deepEqual(part.uvs,uvs);
  assert.ok(part.colors.every(v=>Number.isFinite(v)&&v>=0&&v<=1));
  tints.push(part.colors.slice(0,3).join(","));
 }
 assert.equal(new Set(tints).size,6);
});
test("three attachment finish materials use independent faction colors",()=>{
 const primary=component(),attachments=[component(),component()];
 finishVehicleAssembly(primary,attachments,"dwarfs");
 assert.notDeepEqual(primary.colors.slice(0,3),attachments[0].colors.slice(0,3));
 assert.notDeepEqual(attachments[0].colors.slice(0,3),attachments[1].colors.slice(0,3));
});
test("vehicle finish rejects unknown identity, malformed channels and nonfinite paint",()=>{
 assert.throws(()=>finishVehicleComponent(component(),"unknown"),/Invalid faction/);
 assert.throws(()=>finishVehicleComponent({colors:[1,1,1]},"humans"),/Invalid faction/);
 const broken=component();broken.colors[0]=Infinity;
 assert.throws(()=>finishVehicleComponent(broken,"humans"),/Non-finite/);
});
