import test from "node:test";
import assert from "node:assert/strict";
import {ALL_SKINNED_ROLES} from "../web/skinnedRoster.js";
import {ROSTER_ROLES} from "../web/rosterArt.js";
import {FACTION_SLUGS} from "../web/factionArt.js";
import {VEHICLE_ROLES,VEHICLE_GLTF_COUNT,vehicleGltfPath,vehicleDomain} from "../web/vehicleArt.js";
test("all 216 original unique unit archetypes are partitioned into humanoid and vehicle art",()=>{
 assert.equal(VEHICLE_ROLES.length,20);
 assert.equal(VEHICLE_GLTF_COUNT,120);
 assert.equal(ALL_SKINNED_ROLES.length+VEHICLE_ROLES.length,ROSTER_ROLES.length);
 assert.deepEqual(new Set([...ALL_SKINNED_ROLES,...VEHICLE_ROLES]),new Set(ROSTER_ROLES));
 const paths=new Set();
 for(const faction of FACTION_SLUGS)for(const role of VEHICLE_ROLES){
  paths.add(vehicleGltfPath(faction,role));
  assert.ok(["naval","air","siege"].includes(vehicleDomain(role)));
 }
 assert.equal(paths.size,120);
 assert.equal(vehicleGltfPath("Humans","Archer"),null);
 assert.equal(vehicleGltfPath("../bad","Bomber"),null);
});
