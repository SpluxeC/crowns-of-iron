import test from "node:test";
import assert from "node:assert/strict";
import {MatchHost} from "../src/network.js";
import {setCombatStance,issueAttackMove,selectAutomaticTarget} from "../src/combatDirectives.js";
import {enableUnitCollision,validateCollisionState} from "../src/unitCollision.js";
test("attack move and combat stance enforce ownership, range and capability",()=>{
 const host=new MatchHost([{id:"a",faction:"Humans"},{id:"b",faction:"Orcs"}],73);
 const p=host.match.players[0],unit=p.units.find(u=>u.attack>0);
 assert.ok(unit);
 assert.throws(()=>setCombatStance(host.match,"b",unit.id,"guard"),/owned/);
 assert.throws(()=>setCombatStance(host.match,"a",unit.id,"berserk"),/Invalid combat stance/);
 assert.deepEqual(setCombatStance(host.match,"a",unit.id,"guard"),{unitId:unit.id,stance:"guard"});
 const x=unit.x,y=unit.y;
 const result=issueAttackMove(host.match,"a",unit.id,x,y);
 assert.equal(result.distance,0);
 assert.equal(host.match.orders[unit.id].kind,"attackMove");
 assert.throws(()=>issueAttackMove(host.match,"b",unit.id,x,y),/owned armed/);
 assert.throws(()=>issueAttackMove(host.match,"a",unit.id,-1,y),/destination/);
});
test("automatic target choice chooses nearest hostile and excludes hidden/different domain",()=>{
 const host=new MatchHost([{id:"a",faction:"Humans"},{id:"b",faction:"Orcs"}],89);
 const unit=host.match.players[0].units.find(u=>u.attack>0);
 const enemy=host.match.players[1].units.find(u=>u.alive);
 enemy.x=unit.x+2;enemy.y=unit.y;
 assert.equal(selectAutomaticTarget(host.match,"a",unit)?.targetId,enemy.id);
 enemy.x=unit.x+10;
 assert.equal(selectAutomaticTarget(host.match,"a",unit),null);
});
