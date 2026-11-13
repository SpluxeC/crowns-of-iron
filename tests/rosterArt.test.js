import test from "node:test";
import assert from "node:assert/strict";
import {ALL_ARCHETYPES} from "../src/extendedCatalog.js";
import {ROSTER_ROLES,ROSTER_MESH_COUNT,roleFamily,rosterDomain,
 rosterMeshPath,rosterMeshKey,LAND_ROLES,NAVAL_ROLES,AIR_ROLES} from "../web/rosterArt.js";
import {FACTION_SLUGS} from "../web/factionArt.js";
test("complete 216-entry RTS art roster matches authoritative gameplay archetypes",()=>{
 assert.equal(ROSTER_MESH_COUNT,216);
 assert.deepEqual([LAND_ROLES.length,NAVAL_ROLES.length,AIR_ROLES.length],[22,8,6]);
 assert.deepEqual(new Set(ROSTER_ROLES),new Set(Object.keys(ALL_ARCHETYPES)));
 const keys=new Set();
 for(const faction of FACTION_SLUGS)for(const role of ROSTER_ROLES){
  const key=rosterMeshKey(faction,role);
  assert.ok(key);
  keys.add(key);
  assert.match(rosterMeshPath(faction,role),/\.obj$/);
  assert.ok(["worker","infantry","ranged","hero","siege","ship","air"]
   .includes(roleFamily(role)));
  assert.ok(["land","naval","air"].includes(rosterDomain(role)));
 }
 assert.equal(keys.size,216);
 assert.equal(rosterMeshPath("Humans","../secret"),null);
 assert.equal(rosterMeshPath("Unknown","Worker"),null);
 assert.equal(roleFamily("Nonexistent"),null);
});
