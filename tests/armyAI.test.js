import test from "node:test";
import assert from "node:assert/strict";
import {createMatch} from "../src/simulation.js";
import {attachBattlefield} from "../src/battlefield.js";
import {makeMap} from "../src/map.js";
import {enableBot} from "../src/ai.js";
import {setArmyStance,planArmyOrders} from "../src/armyAI.js";
import {makeUnit} from "../src/state.js";
import {ARCHETYPES} from "../src/catalog.js";
function fixture(){
 const m=createMatch([{id:"a",faction:"Humans"},{id:"b",faction:"Orcs"}],10);
 const map=makeMap({seed:10,players:2});
 for(const t of map.tiles){t.terrain="grass";t.occupied=null;t.resource=null;t.amount=0;}
 attachBattlefield(m,map);enableBot(m,"a","Hard");
 const start=map.starts[0],p=m.players[0],enemy=m.players[1];
 const archer=makeUnit(p,"Archer",ARCHETYPES.Archer,"tactical-archer");
 archer.x=start.x+1;archer.y=start.y;p.units.push(archer);p.popUsed+=archer.pop;
 enemy.units[0].x=start.x+6;enemy.units[0].y=start.y;
 enemy.units[1].x=start.x+5;enemy.units[1].y=start.y+1;
 return {m,p,enemy,archer,start};
}
test("defend stance does not pursue opponents outside home radius",()=>{
 const f=fixture();
 f.enemy.units.forEach(u=>{u.x=40;u.y=40;});
 setArmyStance(f.m,"a","defend");
 const orders=planArmyOrders(f.m,"a",{stance:"defend"});
 assert.equal(orders.length,0);
});
test("raid stance prefers reachable nearby workers and is reproducible",()=>{
 const a=fixture(),b=fixture();
 for(const f of [a,b]){
  setArmyStance(f.m,"a","raid");
  f.enemy.units[1].archetype="Heavy Infantry";
  f.enemy.units[1].hp=200;
 }
 const oa=planArmyOrders(a.m,"a",{stance:"raid",maxOrders:4});
 const ob=planArmyOrders(b.m,"a",{stance:"raid",maxOrders:4});
 assert.deepEqual(oa,ob);
 assert.ok(oa.length>0);
 const first=a.m.orders[a.archer.id];
 assert.equal(first.targetId,a.enemy.units[0].id);
});
test("hold stance clears bot-issued attacks and rejects malformed stance",()=>{
 const f=fixture();
 planArmyOrders(f.m,"a");
 assert.ok(f.m.orders[f.archer.id]);
 setArmyStance(f.m,"a","hold");
 assert.equal(f.m.orders[f.archer.id],undefined);
 assert.deepEqual(planArmyOrders(f.m,"a",{stance:"hold"}),[]);
 assert.throws(()=>setArmyStance(f.m,"a","teleport"),/Invalid army stance/);
});
