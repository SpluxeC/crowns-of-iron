import test from "node:test";
import assert from "node:assert/strict";
import {MAX_BATCH,stopOrders,attackOrders,selectedVisibleEnemy} from "../web/combatOrders.js";
const player={id:"a",team:1,units:[
 {id:"worker",alive:true,attack:4,x:2,y:1},
 {id:"sword",alive:true,attack:12,x:3,y:3},
 {id:"healer",alive:true,attack:0,x:3,y:4},
 {id:"dead",alive:false,attack:20,x:2,y:3}
]};
test("bounded combat orders dedupe selection, omit invalid attackers and sequence correctly",()=>{
 assert.equal(MAX_BATCH,16);
 assert.deepEqual(attackOrders(player,["sword","sword","healer","dead","worker"],"b","target",4)
  .map(x=>[x.sequence,x.action,x.payload.attacker]),[[4,"attack","sword"],[5,"attack","worker"]]);
 assert.deepEqual(stopOrders(player,["sword","dead","healer","sword"],10)
  .map(x=>[x.sequence,x.payload.unitId]),[[10,"sword"],[11,"healer"]]);
 assert.equal(attackOrders(player,["sword"],"","target").length,0);
 assert.equal(stopOrders(player,Array.from({length:100},()=> "sword")).length,1);
});
test("target picker uses fog-filtered state, never allied or hidden targets",()=>{
 const state={players:[player,{id:"friend",team:1,units:[{id:"f",alive:true,x:7,y:7}]},
  {id:"b",team:2,units:[{id:"enemy",alive:true,x:5,y:5}]}]};
 assert.deepEqual(selectedVisibleEnemy(state,"a",5,5),{targetPlayer:"b",targetId:"enemy"});
 assert.equal(selectedVisibleEnemy(state,"a",7,7),null);
 assert.equal(selectedVisibleEnemy(state,"a",6,6),null);
 assert.equal(selectedVisibleEnemy(state,"missing",5,5),null);
});
