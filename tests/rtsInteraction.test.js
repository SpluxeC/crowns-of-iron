import test from "node:test";
import assert from "node:assert/strict";
import {MAX_SELECTION,clampSelection,rectangleUnits,smartOrder,placementValid}
 from "../web/rtsInteraction.js";
const map={width:8,height:8,tiles:Array.from({length:64},(_,i)=>({
 x:i%8,y:Math.floor(i/8),terrain:"grass",occupied:null}))};
const soldiers=[{id:"s1",x:2,y:2,archetype:"Swordsman",attack:14,alive:true},
 {id:"s2",x:4,y:4,archetype:"Archer",attack:12,alive:true},
 {id:"w1",x:3,y:5,archetype:"Worker",attack:0,alive:true}];
const players=[{id:"human",units:soldiers},{id:"ai-1",units:[{id:"e",x:7,y:7,alive:true}]}];
test("selection rectangle includes only human units whose projections are inside",()=>{
 const ids=rectangleUnits(players,map,{}, {x1:100,y1:100,x2:290,y2:290},800,600,
  u=>({x:u.x*75,y:u.y*55}));
 assert.deepEqual(ids,["s1"]);
});
test("selection clamps to known unit IDs, supports shift toggling, and caps groups",()=>{
 assert.deepEqual(clampSelection(["s1","s2","fake"],["s1","s2"]),["s1","s2"]);
 assert.deepEqual(clampSelection(["s2"],["s1","s2"],true,["s1","s2"]),["s1"]);
 const many=Array.from({length:50},(_,i)=>"unit"+i);
 assert.equal(clampSelection(many,many).length,MAX_SELECTION);
});
test("smart orders route enemy targets to attack and structures to siege",()=>{
 const unit=smartOrder({selected:["s1","w1"],units:soldiers,
  hit:{kind:"unit",unit:{id:"e",side:"ai-1"}},
  tile:{x:7,y:7},terrain:{terrain:"grass"}});
 assert.equal(unit.length,2);assert.equal(unit[0].action,"attack");
 const site=smartOrder({selected:["s1","w1"],units:soldiers,
  hit:{kind:"structure",site:{id:"enemy-house",owner:"ai-1"}},
  tile:{x:6,y:6}});
 assert.deepEqual(site,[{action:"attackStructure",unitId:"s1",siteId:"enemy-house"}]);
});
test("smart worker commands harvest; mixed army moves in formation",()=>{
 const harvest=smartOrder({selected:["w1","s1"],units:soldiers,
  tile:{x:4,y:5},terrain:{resource:"Wood"}});
 assert.deepEqual(harvest,[{action:"assignHarvest",workerId:"w1",x:4,y:5}]);
 const march=smartOrder({selected:["s1","s2"],units:soldiers,
  tile:{x:6,y:6},terrain:{terrain:"grass"}});
 assert.equal(march.length,1);assert.equal(march[0].action,"formation");
 assert.deepEqual(march[0].units,["s1","s2"]);
 const attackMove=smartOrder({selected:["s1","s2"],units:soldiers,
  tile:{x:6,y:6},modifier:true});
 assert.equal(attackMove.length,2);assert.ok(attackMove.every(o=>o.action==="attackMove"));
});
test("building footprints reject occupied, non-grass, and off-map cells",()=>{
 assert.equal(placementValid(map,2,2,[3,3]),true);
 assert.equal(placementValid(map,7,7,[2,2]),false);
 const other=structuredClone(map);other.tiles[3*8+3].terrain="water";
 assert.equal(placementValid(other,2,2,[3,3]),false);
 other.tiles[3*8+3].terrain="grass";other.tiles[3*8+3].occupied="structure";
 assert.equal(placementValid(other,2,2,[3,3]),false);
});
