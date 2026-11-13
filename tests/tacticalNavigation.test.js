import test from "node:test";
import assert from "node:assert/strict";
import {makeMap,at} from "../src/map.js";
import {hasLineOfSight,findAttackApproach} from "../src/tacticalNavigation.js";
function open(){
 const map=makeMap({width:32,height:32,seed:81,players:2});
 for(const t of map.tiles){t.terrain="grass";t.occupied=null;t.resource=null;t.amount=0;}
 return map;
}
test("ranged line of sight is blocked by hills and structures, not empty grass",()=>{
 const m=open(),a={x:3,y:3},b={x:8,y:3};
 assert.equal(hasLineOfSight(m,a,b),true);
 at(m,5,3).terrain="hill";assert.equal(hasLineOfSight(m,a,b),false);
 at(m,5,3).terrain="grass";at(m,5,3).occupied="wall";
 assert.equal(hasLineOfSight(m,a,b),false);
});
test("obstructed ranged attackers choose a reachable alternate firing position",()=>{
 const m=open(),from={x:3,y:3},target={x:9,y:3};
 at(m,6,3).terrain="hill";
 const path=findAttackApproach(m,from,target,7);
 assert.ok(path&&path.length>1);
 const last=path.at(-1);
 assert.equal(hasLineOfSight(m,last,target),true);
 assert.ok(Math.abs(last.x-target.x)+Math.abs(last.y-target.y)<=7);
});
test("sealed targets cannot be engaged by melee pathfinding",()=>{
 const m=open(),from={x:3,y:3},target={x:15,y:15};
 for(const [dx,dy] of [[0,-1],[1,0],[0,1],[-1,0]]){
   at(m,target.x+dx,target.y+dy).terrain="water";
 }
 assert.equal(findAttackApproach(m,from,target,1),null);
});
test("equivalent maps produce identical attack approaches",()=>{
 const a=open(),b=open();
 for(const map of [a,b]){at(map,5,4).occupied="wall";at(map,5,5).occupied="wall";}
 assert.deepEqual(findAttackApproach(a,{x:3,y:4},{x:9,y:4},4),
   findAttackApproach(b,{x:3,y:4},{x:9,y:4},4));
});
