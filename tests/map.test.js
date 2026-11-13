import test from "node:test";
import assert from "node:assert/strict";
import {makeMap,mapChecksum,nearbyResources,walkable,findPath,placeBuilding,removeBuilding,canPlace,asciiMap} from "../src/map.js";
test("procedural maps are deterministic and seeds matter",()=>{
 const a=makeMap({seed:4,players:4}),b=makeMap({seed:4,players:4}),c=makeMap({seed:5,players:4});
 assert.equal(mapChecksum(a),mapChecksum(b));
 assert.notEqual(mapChecksum(a),mapChecksum(c));
});
test("every player has equivalent basic safe resource supply",()=>{
 for(const n of [2,4,6,8]){
  const m=makeMap({seed:17,players:n});
  for(const s of m.starts){
   const r=nearbyResources(m,s,4);
   for(const k of ["Food","Wood","Stone","Gold","Metal"])assert.ok(r[k]>0,"missing "+k);
   assert.ok(walkable(m,s.x,s.y),"starting tile blocked");
  }
 }
});
test("placed buildings reserve grid cells and can be removed",()=>{
 const m=makeMap({seed:34});
 const p={owner:"a",kind:"Barracks",x:3.2,y:3.8,width:2,height:2};
 // Search for valid 2x2 region without deposits.
 let candidate=null;
 for(let y=0;y<m.height-1&&!candidate;y++)for(let x=0;x<m.width-1;x++)if(canPlace(m,x,y,2,2)){candidate={x,y};break;}
 assert.ok(candidate);
 const s=placeBuilding(m,{owner:"a",kind:"Barracks",...candidate,width:2,height:2});
 assert.equal(canPlace(m,candidate.x,candidate.y,2,2),false);
 assert.throws(()=>placeBuilding(m,{owner:"a",kind:"Other",...candidate,width:2,height:2}),/Invalid/);
 removeBuilding(m,s.id);
 assert.equal(canPlace(m,candidate.x,candidate.y,2,2),true);
});
test("pathfinding yields valid contiguous land-only routes",()=>{
 const m=makeMap({seed:27,players:4});
 const route=findPath(m,m.starts[0],m.starts[2]);
 assert.ok(route&&route.length>0);
 for(let i=1;i<route.length;i++){
  assert.equal(Math.abs(route[i].x-route[i-1].x)+Math.abs(route[i].y-route[i-1].y),1);
  assert.ok(walkable(m,route[i].x,route[i].y));
 }
 assert.ok(asciiMap(m).includes("~"));
});
