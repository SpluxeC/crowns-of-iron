import {assert} from "./util.js";
import {makeMap,at,canPlace} from "./map.js";

export const COASTAL_STRUCTURES=new Set(["Dock","Shipyard","Advanced Shipyard"]);
const ORTHO=[[0,-1],[1,0],[0,1],[-1,0]];
export function isCoastalStructure(kind){return COASTAL_STRUCTURES.has(kind);}
export function hasCoastalAccess(map,x,y,width,height){
  for(let dy=0;dy<height;dy++)for(let dx=0;dx<width;dx++){
    const tx=x+dx,ty=y+dy;
    for(const [ox,oy] of ORTHO){
      const nx=tx+ox,ny=ty+oy;
      if(nx>=x&&nx<x+width&&ny>=y&&ny<y+height)continue;
      const neighbor=at(map,nx,ny);
      if(neighbor?.terrain==="water"&&neighbor.occupied===null)return true;
    }
  }
  return false;
}
export function validCoastalPlacement(map,x,y,width,height){
  return canPlace(map,x,y,width,height)&&hasCoastalAccess(map,x,y,width,height);
}
function carve(map,x,y,terrain){
  const t=at(map,x,y);
  if(!t)return;
  t.terrain=terrain;t.resource=null;t.amount=0;t.occupied=null;
}
/**
 * Opt-in generated naval map: guaranteed continuous perimeter sea lane,
 * with deterministic buildable shoreline pads for each starting position.
 * Preserves original makeMap default for existing land/economy benchmarks.
 */
export function makeCoastalMap(options={}){
  const map=makeMap(options);
  const {width:w,height:h}=map;
  // Clear isolated procedural ponds so sea lanes form one connected ocean.
  for(const tile of map.tiles)if(tile.terrain==="water"){
    tile.terrain="grass";tile.resource=null;tile.amount=0;
  }
  for(let x=0;x<w;x++){carve(map,x,0,"water");carve(map,x,h-1,"water");}
  for(let y=0;y<h;y++){carve(map,0,y,"water");carve(map,w-1,y,"water");}
  map.coastal=true;
  map.coastalPads=[];
  for(const start of map.starts){
    const boundaries=[
      {side:"top",distance:start.y},
      {side:"right",distance:w-1-start.x},
      {side:"bottom",distance:h-1-start.y},
      {side:"left",distance:start.x}
    ].sort((a,b)=>a.distance-b.distance||a.side.localeCompare(b.side));
    const side=boundaries[0].side;
    let x,y,width,height;
    if(side==="top"||side==="bottom"){
      width=8;height=5;x=Math.max(1,Math.min(w-9,start.x-4));
      y=side==="top"?1:h-height-1;
    }else{
      width=5;height=8;x=side==="left"?1:w-width-1;
      y=Math.max(1,Math.min(h-9,start.y-4));
    }
    for(let yy=y;yy<y+height;yy++)for(let xx=x;xx<x+width;xx++)
      carve(map,xx,yy,"grass");
    map.coastalPads.push({player:start.player,side,x,y,width,height});
    // Connect the existing land starting position to this shore using grass.
    const shore={x:Math.max(x,Math.min(x+width-1,start.x)),
      y:Math.max(y,Math.min(y+height-1,start.y))};
    let px=start.x,py=start.y;
    while(px!==shore.x){px+=Math.sign(shore.x-px);carve(map,px,py,"grass");}
    while(py!==shore.y){py+=Math.sign(shore.y-py);carve(map,px,py,"grass");}
    // Reapply the guaranteed resources that existed before shore carving only
    // if undisturbed. Coast pads are symmetric by start index / geometry.
  }
  return map;
}
export function verifySeaConnectivity(map){
  const queue=[],visited=new Set();
  for(const t of map.tiles)if(t.terrain==="water"){queue.push(t);break;}
  if(!queue.length)return {connected:false,total:0,reachable:0};
  visited.add(queue[0].x+","+queue[0].y);
  for(let i=0;i<queue.length;i++){
    const node=queue[i];
    for(const [dx,dy] of ORTHO){
      const n=at(map,node.x+dx,node.y+dy);
      if(n?.terrain!=="water")continue;
      const id=n.x+","+n.y;
      if(!visited.has(id)){visited.add(id);queue.push(n);}
    }
  }
  const total=map.tiles.filter(t=>t.terrain==="water").length;
  return {connected:visited.size===total,total,reachable:visited.size};
}
