import test from "node:test";
import assert from "node:assert/strict";
import {assetForUnit,assetForBuilding,validateAssetRegistry,UNIT_ASSETS} from "../web/assetManifest.js";
test("asset registry selects stable versioned role proxies and safe generic fallback",()=>{
 assert.deepEqual(validateAssetRegistry(),{schema:1,unitFamilies:7,buildingFamilies:3});
 assert.equal(assetForUnit({archetype:"Worker"}).id,"unit.worker.v1");
 assert.equal(assetForUnit({archetype:"Archer"}).accessory,"ranged");
 assert.equal(assetForUnit({archetype:"Interceptor"}).role,"air");
 assert.equal(assetForUnit({archetype:"Legendary Warship"}).role,"ship");
 assert.equal(assetForUnit({archetype:"Battering Ram"}).role,"siege");
 assert.equal(assetForUnit({archetype:"Unknown Future Unit"}).role,"infantry");
 assert.equal(Object.isFrozen(UNIT_ASSETS),true);
});
test("structure asset metadata differentiates towers, fortifications, and civilian sites",()=>{
 assert.equal(assetForBuilding("Fortress").family,"tower");
 assert.equal(assetForBuilding("Stone Wall").family,"defense");
 assert.equal(assetForBuilding("Farm").family,"civilian");
 assert.ok(assetForBuilding("Watchtower").height>assetForBuilding("Farm").height);
});
