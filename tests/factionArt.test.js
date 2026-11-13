import test from "node:test";
import assert from "node:assert/strict";
import {FACTION_SLUGS,factionSlug,factionMeshKey,factionMeshPath} from "../web/factionArt.js";
test("all six factions resolve distinct ten-family OBJ mesh asset keys",()=>{
 const roles=["worker","infantry","ranged","hero","siege","ship","air","civilian","defense","tower"];
 const keys=new Set(FACTION_SLUGS.flatMap(f=>roles.map(role=>factionMeshKey(f,role))));
 assert.equal(keys.size,60);
 assert.equal(factionSlug("Tree Elves"),"tree-elves");
 assert.equal(factionSlug("Corrupt Elves"),"corrupt-elves");
 assert.equal(factionMeshPath("Ursa","hero"),
  "/assets/models/factions/ursa/hero.obj");
 assert.equal(factionMeshPath("unknown","worker"),null);
 assert.equal(factionMeshPath("Humans","../../secrets"),null);
});
