/** RTS camera math, browser-independent for deterministic tests.
 * pitch is elevation above horizon: 55° is a 55° downward viewing angle.
 * World is X/Z with Y elevation; screen y grows downward.
 */
const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
const approach=(current,target,speed,dt)=>current+(target-current)*(1-Math.exp(-speed*dt));
export const RTS_CAMERA=Object.freeze({
 defaultPitch:55*Math.PI/180, closePitch:43*Math.PI/180,
 minRadius:17,maxRadius:88,defaultRadius:59,panSpeed:18,
 edgePx:26,zoomRate:.11,rotateSensitivity:.0055,
 minClearance:3.5,transition:9,terrainTransition:5
});
export function normalizedPan(x,z){
 const length=Math.hypot(x,z);
 return length>1?{x:x/length,z:z/length}:{x,z};
}
export function clampFocus(x,z,width,height,margin=1){
 if(!Number.isFinite(width)||!Number.isFinite(height)||width<2||height<2)
  throw Error("Invalid battlefield dimensions");
 const m=clamp(margin,0,Math.min(width,height)/2-.01);
 return {x:clamp(x,m,width-m),z:clamp(z,m,height-m)};
}
export function sampleTerrain(world,x,z,heightFor){
 if(!world?.tiles?.length||!Number.isFinite(x)||!Number.isFinite(z))return 0;
 // Bilinear low-pass on tile centers. The camera should not jump at cell seams.
 const mx=clamp(x-.5,0,world.width-1),mz=clamp(z-.5,0,world.height-1);
 const ix=Math.floor(mx),iz=Math.floor(mz),
  fx=mx-ix,fz=mz-iz,ex=Math.min(ix+1,world.width-1),
  ez=Math.min(iz+1,world.height-1);
 const tile=(a,b)=>heightFor(world.tiles[b*world.width+a]);
 const a=tile(ix,iz)*(1-fx)+tile(ex,iz)*fx;
 const b=tile(ix,ez)*(1-fx)+tile(ex,ez)*fx;
 return a*(1-fz)+b*fz;
}
export function pitchForZoom(radius,settings=RTS_CAMERA){
 const t=clamp((radius-settings.minRadius)/
  (settings.maxRadius-settings.minRadius),0,1);
 // Close view is flatter, tactical wide view more top-down.
 return settings.closePitch+(settings.defaultPitch-settings.closePitch)*t;
}
export function cameraEye({x,z,ground=0,radius,pitch,yaw}){
 return {x:x+radius*Math.cos(pitch)*Math.sin(yaw),
  y:ground+radius*Math.sin(pitch),
  z:z+radius*Math.cos(pitch)*Math.cos(yaw)};
}
export function edgeAxis(pointerX,pointerY,width,height,edgePx=RTS_CAMERA.edgePx){
 if(!Number.isFinite(pointerX)||!Number.isFinite(pointerY)||
  pointerX<0||pointerY<0||pointerX>width||pointerY>height)
  return {x:0,z:0};
 return {x:pointerX<edgePx?-1:pointerX>width-edgePx?1:0,
  z:pointerY<edgePx?-1:pointerY>height-edgePx?1:0};
}
export function createRtsCamera({width=48,height=48,settings=RTS_CAMERA}={}){
 const center=clampFocus(width/2,height/2,width,height);
 const current={x:center.x,z:center.z,ground:.12,
  radius:settings.defaultRadius,yaw:0,pitch:settings.defaultPitch};
 const target={...current};
 let map={width,height,tiles:null},lastPan={x:0,z:0};
 const held=new Set();
 const panKeys=()=>({x:Number(held.has("d")||held.has("arrowright"))-
  Number(held.has("a")||held.has("arrowleft")),
  z:Number(held.has("s")||held.has("arrowdown"))-
  Number(held.has("w")||held.has("arrowup"))});
 function setMap(world,{focusStart=false}={}){
  if(!world?.width||!world?.height)throw Error("Missing camera world");
  map=world;
  if(focusStart){const pos=clampFocus(
   world.width/2,world.height/2,world.width,world.height);
   current.x=target.x=pos.x;current.z=target.z=pos.z;}
  const p=clampFocus(target.x,target.z,world.width,world.height);
  target.x=p.x;target.z=p.z;
 }
 function focus(x,z,{immediate=false}={}){
  const p=clampFocus(x,z,map.width,map.height);
  target.x=p.x;target.z=p.z;
  if(immediate){current.x=p.x;current.z=p.z;}
 }
 function zoom(delta){
  if(!Number.isFinite(delta))return;
  // Wheel delta in pixels; +/-120 one typical detent.
  const ticks=clamp(delta/120,-4,4);
  target.radius=clamp(target.radius*Math.exp(ticks*settings.zoomRate),
   settings.minRadius,settings.maxRadius);
 }
 function rotate(dx){if(Number.isFinite(dx))target.yaw+=dx*settings.rotateSensitivity;}
 function resetRotation(){target.yaw=0;}
 function key(name,down){
  name=String(name).toLowerCase();
  if(!["w","a","s","d","arrowup","arrowdown","arrowleft","arrowright"]
   .includes(name))return false;
  if(down)held.add(name);else held.delete(name);
  return true;
 }
 function update(deltaSeconds,{edge={x:0,z:0},terrainHeight=()=>0}={}){
  const dt=clamp(deltaSeconds,0,.10);
  if(!dt)return false;
  const keys=panKeys(),axis=normalizedPan(keys.x+edge.x,keys.z+edge.z);
  const cos=Math.cos(target.yaw),sin=Math.sin(target.yaw);
  // Camera-local right=(cos,-sin), forward=(-sin,-cos).
  const dx=axis.x*cos+axis.z*sin,dz=-axis.x*sin+axis.z*cos;
  const speed=settings.panSpeed*(.65+target.radius/settings.defaultRadius*.35);
  const pos=clampFocus(target.x+dx*speed*dt,target.z+dz*speed*dt,
   map.width,map.height);
  target.x=pos.x;target.z=pos.z;
  target.pitch=pitchForZoom(target.radius,settings);
  target.ground=terrainHeight(map,target.x,target.z);
  const before=JSON.stringify(current);
  for(const prop of ["x","z","radius","pitch","yaw"])
   current[prop]=approach(current[prop],target[prop],settings.transition,dt);
  current.ground=approach(current.ground,
   terrainHeight(map,current.x,current.z),settings.terrainTransition,dt);
  // If rotated by many turns keep values bounded.
  if(Math.abs(current.yaw)>Math.PI*12){
   const turns=Math.round(current.yaw/(Math.PI*2));
   current.yaw-=turns*Math.PI*2;target.yaw-=turns*Math.PI*2;
  }
  lastPan={x:dx,z:dz};
  return JSON.stringify(current)!==before;
 }
 function pose(terrainHeight=()=>0){
  const eye=cameraEye(current);
  const under=terrainHeight(map,eye.x,eye.z);
  const clearance=settings.minClearance;
  // If the eye crosses a hill, elevate both eye and focus equally.
  const lift=Math.max(0,under+clearance-eye.y);
  return {targetX:current.x,targetZ:current.z,targetY:current.ground+lift,
   pitch:current.pitch,yaw:current.yaw,radius:current.radius,fovDeg:52};
 }
 return {setMap,focus,zoom,rotate,resetRotation,key,update,pose,
  state:()=>({...current}),target:()=>({...target}),pan:()=>({...lastPan})};
}
