import test from "node:test";
import assert from "node:assert/strict";
import {makeIslandMap} from "../src/islandMaps.js";
import {verifySeaConnectivity} from "../src/coastal.js";
import {at} from "../src/map.js";
import {createMatch,command,step} from "../src/simulation.js";
import {attachBattlefield} from "../src/battlefield.js";
import {makeUnit} from "../src/state.js";
import {ALL_ARCHETYPES} from "../src/extendedCatalog.js";
import {canEngage} from "../src/engagementRules.js";
test("deterministic central islands connect to the coastal sea for 2–8 players",()=>{
 for(const players of [2,4,6,8]){
  const options={width:64,height:64,seed:38,players};
  const a=makeIslandMap(options),b=makeIslandMap(options);
  assert.deepEqual(a,b);
  assert.ok(verifySeaConnectivity(a).connected);
  assert.equal(a.navalObjectives.length,2);
  assert.equal(at(a,32,32).terrain!=="water",true);
  for(const s of a.starts)assert.notEqual(at(a,s.x,s.y).terrain,"water");
 }
});
test("melee units cannot attack vessels, while suitable naval guns can engage shore units",()=>{
 const mk=role=>({archetype:role,attack:20});
 assert.equal(canEngage(mk("Swordsman"),mk("Light Warship")),false);
 assert.equal(canEngage(mk("Archer"),mk("Light Warship")),true);
 assert.equal(canEngage(mk("Light Warship"),mk("Swordsman")),false);
 assert.equal(canEngage(mk("Heavy Warship"),mk("Swordsman")),true);
 assert.equal(canEngage(mk("Heavy Warship"),mk("Interceptor")),false);
 assert.equal(canEngage(mk("Interceptor"),mk("Heavy Warship")),true);
});
test("naval attack command checks engagement domain before the simulation tick",()=>{
 const m=createMatch([{id:"a",faction:"Humans"},{id:"b",faction:"Orcs"}],52);
 const map=makeIslandMap({width:64,height:64,seed:52,players:2});
 attachBattlefield(m,map);
 const p=m.players[0],enemy=m.players[1],start=map.starts[0];
 const ship=makeUnit(enemy,"Light Warship",ALL_ARCHETYPES["Light Warship"],"enemy-ship");
 ship.x=0;ship.y=start.y;enemy.units.push(ship);enemy.popUsed+=ship.pop;
 assert.throws(()=>command(m,{player:"a",action:"attack",attacker:p.units[1].id,
  targetPlayer:"b",target:"enemy-ship"}),/ineligible/);
});
