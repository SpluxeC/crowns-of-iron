import test from "node:test";
import assert from "node:assert/strict";
import {cameraForMap,projectWorld,raycastTerrain,unitVisual} from "../web/webgl3d.js";
test("terrain ray picking hits exact flat and elevated target tiles",()=>{
 const tiles=[];
 for(let y=0;y<32;y++)for(let x=0;x<40;x++)
  tiles.push({x,y,terrain:x===21&&y===15?"hill":"grass"});
 const world={width:40,height:32,tiles};
 const cam=cameraForMap(40,32);
 for(const {x,y} of [{x:19,y:16},{x:21,y:15},{x:25,y:20}]){
  const h=x===21&&y===15?2.2:.12;
  const point=projectWorld({x:x+.5,y:h,z:y+.5},800,640,cam);
  assert.deepEqual(raycastTerrain(cam,point.x,point.y,800,640,world),{x,y});
 }
});
test("terrain ray ignores off-map and upward horizon",()=>{
 const cam=cameraForMap(40,32),world={width:40,height:32,
  tiles:[{x:20,y:16,terrain:"grass"}]};
 assert.equal(raycastTerrain(cam,-2000,-2000,800,640,world),null);
});
test("role-driven unit geometry distinguishes aircraft, ships, heroes, workers",()=>{
 assert.ok(unitVisual({archetype:"Scout Aircraft"}).offset>1);
 assert.ok(unitVisual({archetype:"Transport Ship"}).width>.7);
 assert.ok(unitVisual({archetype:"Hero"}).height>unitVisual({archetype:"Worker"}).height);
});
