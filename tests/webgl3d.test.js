import test from "node:test";
import assert from "node:assert/strict";
import {cameraForMap,projectWorld,pickNearestTile} from "../web/webgl3d.js";
test("WebGL 3D camera centers terrain and projects elevation upward",()=>{
 const camera=cameraForMap(40,32);
 const low=projectWorld({x:20,y:0,z:16},800,640,camera);
 const high=projectWorld({x:20,y:4,z:16},800,640,camera);
 assert.ok(low.x>0&&low.x<800&&low.y>0&&low.y<640);
 assert.ok(high.y<low.y);
});
test("projection deterministic and responds to orbit parameters",()=>{
 const a=projectWorld({x:8,y:2,z:8},800,640,cameraForMap(40,32));
 const b=projectWorld({x:8,y:2,z:8},800,640,cameraForMap(40,32));
 const other=projectWorld({x:8,y:2,z:8},800,640,
  cameraForMap(40,32,{yaw:1.9,pitch:.72,radius:68}));
 assert.deepEqual(a,b);assert.notEqual(a.x,other.x);
});
test("bounded projected tile picking selects nearest center",()=>{
 const points=[{x:120,y:140,tileX:1,tileY:2},
  {x:300,y:310,tileX:5,tileY:6}];
 assert.deepEqual(pickNearestTile(points,124,143),{x:1,y:2});
 assert.equal(pickNearestTile(points,600,600),null);
});
