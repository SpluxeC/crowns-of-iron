import test from "node:test";
import assert from "node:assert/strict";
import {attackMoveOrders,stanceOrders} from "../web/combatOrders.js";
const p={units:[{id:"a",alive:true,attack:10,x:4,y:5},
 {id:"b",alive:true,attack:0,x:4,y:5},
 {id:"c",alive:true,attack:8,x:3,y:4,embarkedAt:"transport"},
 {id:"d",alive:false,attack:9,x:4,y:4}]};
test("client attack move filters unarmed/embarked/invalid and builds bounded requests",()=>{
 assert.deepEqual(attackMoveOrders(p,new Set(["a","b","c","d"]),10,11,3),[
  {sequence:3,action:"attackMove",payload:{unitId:"a",x:10,y:11}}]);
 assert.deepEqual(attackMoveOrders(p,new Set(["a"]),2.2,3),[]);
});
test("client combat stance selection validates enum and player ownership",()=>{
 assert.deepEqual(stanceOrders(p,["a","b","d"],"guard",8),[
  {sequence:8,action:"stance",payload:{unitId:"a",stance:"guard"}}]);
 assert.deepEqual(stanceOrders(p,["a"],"berserk"),[]);
});
