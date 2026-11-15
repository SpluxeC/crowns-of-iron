/** Screen-space hit selection over fog-filtered entities, without any 2D game mode. */
import {cameraForMap,projectWorld,heightFor,unitVisual} from "./webgl3d.js";
export function projectedEntityHit(world,players,cameraPose,px,py,width,height){
 if(!world?.tiles||!Array.isArray(players))return null;
 const cam=cameraForMap(world.width,world.height,cameraPose);
 const proposals=[];
 const add=(entity,point,radius,priority)=>{
  const projection=projectWorld(point,width,height,cam);
  if(!projection)return;
  const distance=Math.hypot(px-projection.x,py-projection.y);
  if(distance>radius)return;
  proposals.push({entity,distance:distance/radius,depth:projection.depth,priority});
 };
 for(const player of players)for(const unit of player.units??[]){
  if(!unit.alive||!Number.isInteger(unit.x)||!Number.isInteger(unit.y))continue;
  const visual=unitVisual(unit),tile=world.tiles[unit.y*world.width+unit.x];
  if(!tile||tile.terrain==="unknown")continue;
  const point={x:unit.x+.5,y:heightFor(tile)+visual.offset+visual.height*.58,
   z:unit.y+.5};
  const feet=projectWorld({x:point.x,y:heightFor(tile),z:point.z},
   width,height,cam);
  const head=projectWorld({x:point.x,y:point.y+visual.height*.42,z:point.z},
   width,height,cam);
  const radius=Math.max(14,Math.min(38,
   feet&&head?Math.abs(feet.y-head.y)*.8+9:20));
  add({kind:"unit",unit:{...unit,side:player.id}},point,radius,0);
 }
 for(const site of world.structures??[]){
  const cx=site.x+(site.width??2)/2,cz=site.y+(site.height??2)/2;
  const tile=world.tiles[site.y*world.width+site.x];
  if(!tile||tile.terrain==="unknown")continue;
  const point={x:cx,y:heightFor(tile)+1.8,z:cz};
  const half=Math.max(site.width??2,site.height??2)/2;
  const edge=projectWorld({x:cx+half,y:point.y,z:cz},width,height,cam);
  const center=projectWorld(point,width,height,cam);
  const radius=Math.max(18,Math.min(65,
   center&&edge?Math.abs(edge.x-center.x)+15:32));
  add({kind:"structure",site},point,radius,1);
 }
 proposals.sort((a,b)=>a.distance-b.distance||
  a.priority-b.priority||a.depth-b.depth);
 return proposals[0]?.entity??null;
}
