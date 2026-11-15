import test from "node:test";
import assert from "node:assert/strict";
import {createRtsCamera,RTS_CAMERA,normalizedPan,edgeAxis,
 sampleTerrain,pitchForZoom,clampFocus,cameraEye} from "../web/rtsCamera.js";
import {cameraForMap,projectWorld,heightFor} from "../web/webgl3d.js";
import {projectedEntityHit} from "../web/rtsPicking.js";
const world=(width=32,height=32)=>({width,height,
 tiles:Array.from({length:width*height},(_,i)=>({
  x:i%width,y:Math.floor(i/width),terrain:"grass"})),
 structures:[]});
const near=(a,b,tolerance=.01)=>assert.ok(Math.abs(a-b)<tolerance,
 "Expected "+a+" ≈ "+b);
test("normalizes diagonals and identifies viewport-edge pan",()=>{
 const vector=normalizedPan(1,1);
 near(Math.hypot(vector.x,vector.z),1);
 assert.deepEqual(edgeAxis(2,100,700,500),{x:-1,z:0});
 assert.deepEqual(edgeAxis(699,499,700,500),{x:1,z:1});
 assert.deepEqual(edgeAxis(350,250,700,500),{x:0,z:0});
 assert.deepEqual(edgeAxis(-100,50,700,500),{x:0,z:0});
});
test("WASD and arrow keys move the focus and cannot leave map bounds",()=>{
 const cam=createRtsCamera({width:32,height:32});
 cam.key("w",true);cam.update(.1);
 const afterW=cam.state();
 assert.ok(afterW.z<16);
 cam.key("w",false);cam.key("arrowright",true);
 cam.update(.1);assert.ok(cam.state().x>16);
 cam.key("arrowright",false);
 cam.focus(-999,999,{immediate:true});
 assert.deepEqual({x:cam.state().x,z:cam.state().z},{x:1,z:31});
 cam.update(.1,{edge:{x:1,z:1}});
 assert.ok(cam.target().x<=31&&cam.target().z<=31);
});
test("camera zoom adjusts pitch, clamps levels, and animates toward target",()=>{
 const cam=createRtsCamera();
 const initial=cam.state().radius;
 cam.zoom(-1200);
 assert.ok(cam.target().radius<initial);
 cam.update(.1);
 assert.ok(cam.state().radius<initial);
 assert.ok(cam.state().radius>cam.target().radius);
 assert.ok(cam.state().pitch<RTS_CAMERA.defaultPitch);
 for(let i=0;i<100;i++)cam.zoom(-10000);
 assert.equal(cam.target().radius,RTS_CAMERA.minRadius);
 for(let i=0;i<100;i++)cam.zoom(10000);
 assert.equal(cam.target().radius,RTS_CAMERA.maxRadius);
 assert.ok(pitchForZoom(20)<pitchForZoom(80));
});
test("middle drag yaw restores north smoothly after release and reset",()=>{
 const cam=createRtsCamera();
 cam.rotate(180);cam.update(.10);
 const yaw=cam.state().yaw;
 assert.ok(yaw>0);
 cam.resetRotation();
 assert.equal(cam.target().yaw,0);
 cam.update(.08);
 assert.ok(cam.state().yaw<yaw&&cam.state().yaw>0);
 for(let i=0;i<70;i++)cam.update(.1);
 near(cam.state().yaw,0);
});
test("camera smoothly follows elevated terrain with no tile-edge jumps",()=>{
 const map=world();
 map.tiles[15*32+15].terrain="hill";
 const height=(m,x,z)=>sampleTerrain(m,x,z,heightFor);
 const cam=createRtsCamera();cam.setMap(map);
 const a=height(map,15.45,15.5),b=height(map,15.55,15.5);
 assert.ok(Math.abs(a-b)<.4);
 cam.focus(15.5,15.5);
 const before=cam.state().ground;cam.update(.05,{terrainHeight:height});
 assert.ok(cam.state().ground>before);
 const pose=cam.pose(height);
 const eye=cameraEye({x:pose.targetX,z:pose.targetZ,ground:pose.targetY,
  radius:pose.radius,pitch:pose.pitch,yaw:pose.yaw});
 assert.ok(eye.y>=height(map,eye.x,eye.z)+RTS_CAMERA.minClearance-.001);
});
test("projected unit and building taps select actual visible 3D entities",()=>{
 const map=world();map.structures.push({id:"site-1",kind:"Town Center",
  owner:"human",x:3,y:3,width:2,height:2});
 const players=[{id:"human",units:[{id:"unit-1",owner:"human",
  archetype:"Worker",x:17,y:17,hp:50,maxHp:50,alive:true}]}];
 const pose={targetX:16,targetZ:16,targetY:.12,yaw:0,
  pitch:55*Math.PI/180,radius:38,fovDeg:52};
 const cam=cameraForMap(32,32,pose),w=960,h=720;
 const unitPoint={x:17.5,z:17.5,y:.12+.93*.58};
 const pixel=projectWorld(unitPoint,w,h,cam);
 assert.equal(projectedEntityHit(map,players,pose,pixel.x,pixel.y,w,h)?.unit?.id,"unit-1");
 const house=projectWorld({x:4,y:heightFor(map.tiles[3*32+3])+1.8,z:4},w,h,cam);
 assert.equal(projectedEntityHit(map,players,pose,house.x,house.y,w,h)?.site?.id,"site-1");
 map.tiles[17*32+17].terrain="unknown";
 assert.notEqual(projectedEntityHit(map,players,pose,pixel.x,pixel.y,w,h)?.unit?.id,"unit-1");
});
