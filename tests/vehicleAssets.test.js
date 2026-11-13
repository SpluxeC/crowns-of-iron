import test from "node:test";
import assert from "node:assert/strict";
import {vehicleAssetFor,vehicleAssetCacheStats} from "../src/vehicleAssets.js";
import {parseVehicleGltf} from "../web/vehicleGltf.js";
test("cached server generates valid air, naval and siege animated glTF",async()=>{
 for(const role of ["Interceptor","Heavy Warship","Siege Tower"]){
  const [a,b]=await Promise.all([
   vehicleAssetFor("dwarfs",role),vehicleAssetFor("dwarfs",role)]);
  assert.equal(a,b);
  const parsed=parseVehicleGltf(JSON.parse(a));
  assert.ok(parsed.count>50&&parsed.embeddedPng);
 }
 assert.ok(vehicleAssetCacheStats().loaded>=3);
 await assert.rejects(vehicleAssetFor("../other","Bomber"),/Unknown/);
 await assert.rejects(vehicleAssetFor("humans","Archer"),/Unknown/);
});
