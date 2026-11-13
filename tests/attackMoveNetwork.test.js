import test from "node:test";
import assert from "node:assert/strict";
import {MatchHost} from "../src/network.js";
import {enableUnitCollision} from "../src/unitCollision.js";
test("authenticated attackMove and stance commands obey ownership and duplicate sequences",()=>{
 const host=new MatchHost([{id:"a",faction:"Humans"},{id:"b",faction:"Orcs"}],42);
 enableUnitCollision(host.match);
 const a=host.credentialsFor("a").token,unit=host.match.players[0].units.find(u=>u.attack>0);
 const {x,y}=unit;
 assert.equal(host.submit({token:a,sequence:1,action:"stance",
  payload:{unitId:unit.id,stance:"hold"}}).accepted,true);
 assert.equal(unit.combatStance,"hold");
 const move=host.submit({token:a,sequence:2,action:"attackMove",
  payload:{unitId:unit.id,x,y}});
 assert.equal(move.accepted,true);
 assert.equal(host.match.orders[unit.id].kind,"attackMove");
 assert.throws(()=>host.submit({token:a,sequence:2,action:"stance",
  payload:{unitId:unit.id,stance:"guard"}}),/Out-of-order/);
 assert.throws(()=>host.submit({token:a,sequence:3,action:"attackMove",
  payload:{unitId:host.match.players[1].units[0].id,x,y}}),/owned armed/);
 assert.equal(host.credentialsFor("a").playerId,"a");
});
test("attackMove acquires visible targets and restores destination order when target dies",()=>{
 const host=new MatchHost([{id:"a",faction:"Humans"},{id:"b",faction:"Orcs"}],62);
 const map=host.match.battlefield;
 for(const t of map.tiles){t.terrain="grass";t.occupied=null;t.resource=null;}
 const attacker=host.match.players[0].units.find(u=>u.attack>0),
  target=host.match.players[1].units.find(u=>u.alive);
 const start={x:attacker.x,y:attacker.y};
 target.x=start.x+1;target.y=start.y;
 const token=host.credentialsFor("a").token;
 const dest={x:start.x,y:start.y+3};
 host.submit({token,sequence:1,action:"attackMove",
  payload:{unitId:attacker.id,...dest}});
 host.advance(1000);
 assert.equal(host.match.orders[attacker.id]?.kind,"attackMove");
 assert.equal(host.match.orders[attacker.id]?.engaged?.targetId,target.id);
 target.alive=false;target.hp=0;
 host.advance(1000);
 assert.equal(host.match.orders[attacker.id]?.engaged,null);
 assert.deepEqual(host.match.orders[attacker.id]?.destination,dest);
});
test("hold stance blocks automatic target detection, aggressive engages nearest enemy",()=>{
 const host=new MatchHost([{id:"a",faction:"Humans"},{id:"b",faction:"Orcs"}],64);
 const map=host.match.battlefield;
 for(const t of map.tiles){t.terrain="grass";t.occupied=null;t.resource=null;}
 const attacker=host.match.players[0].units.find(u=>u.attack>0),
 enemy=host.match.players[1].units.find(u=>u.alive);
 enemy.x=attacker.x+1;enemy.y=attacker.y;
 attacker.combatStance="hold";
 host.advance(1000);
 assert.equal(host.match.orders[attacker.id],undefined);
 attacker.combatStance="aggressive";
 host.advance(1000);
 assert.equal(host.match.orders[attacker.id]?.kind,"attack");
});
