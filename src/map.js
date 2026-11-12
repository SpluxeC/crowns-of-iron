import {makeRng} from "./random.js";
import {assert,clone,hash} from "./util.js";
const CARDINAL=[[0,-1],[1,0],[0,1],[-1,0]];
function key(x,y){return x+","+y;}
export function at(map,x,y){
 if(!Number.isInteger(x)||!Number.isInteger(y)||x<0||y<0||x>=map.width||y>=map.height)return null;
 return map.tiles[y*map.width+x];
}
function overwrite(map,x,y,terrain,resource=null,amount=0){
 const tile=at(map,x,y);if(tile){tile.terrain=terrain;tile.resource=resource;tile.amount=amount;}
}
export function makeMap({width=48,height=48,seed=1,players=2}={}){
 assert(Number.isInteger(width)&&Number.isInteger(height)&&width>=32&&height>=32&&width<=128&&height<=128,"Invalid map size");
 assert(Number.isInteger(players)&&players>=2&&players<=8,"Invalid player count");
 const rng=makeRng(seed),tiles=[];
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
   const r=rng.next(),terrain=r<.065?"water":r<.20?"forest":r<.275?"hill":"grass";
   tiles.push({x,y,terrain,resource:terrain==="forest"?"Wood":terrain==="hill"?"Stone":null,
     amount:terrain==="forest"?150:terrain==="hill"?180:0,occupied:null});
 }
 const map={width,height,seed,players,tiles,starts:[],structures:[],nextBuilding:1};
 const cx=Math.floor(width/2),cy=Math.floor(height/2);
 for(let i=0;i<players;i++){
   const a=(2*Math.PI*i/players)-Math.PI/2;
   const radius=Math.min(width,height)*.365;
   const x=Math.round(cx+Math.cos(a)*radius),y=Math.round(cy+Math.sin(a)*radius);
   map.starts.push({x,y,player:i});
 }
 // Carve routes first to preserve minimum walkability to the shared center.
 for(const start of map.starts){
   let x=start.x,y=start.y;
   while(x!==cx){overwrite(map,x,y,"grass");x+=Math.sign(cx-x);}
   while(y!==cy){overwrite(map,x,y,"grass");y+=Math.sign(cy-y);}
   overwrite(map,cx,cy,"grass");
 }
 // Each player receives guaranteed equivalent near-start resource sources.
 for(const start of map.starts){
   for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++)overwrite(map,start.x+dx,start.y+dy,"grass");
   const locations=[["Food",3,0,750],["Wood",-3,0,900],["Stone",0,3,650],["Gold",0,-3,450],["Metal",3,2,500]];
   for(const [resource,dx,dy,amount] of locations){
     overwrite(map,start.x+dx,start.y+dy,"deposit",resource,amount);
   }
   overwrite(map,start.x,start.y,"grass");
 }
 return map;
}
export function nearbyResources(map,start,radius=4){
 const found={Food:0,Wood:0,Stone:0,Metal:0,Gold:0,Aether:0};
 for(const t of map.tiles)if(t.resource&&Math.abs(t.x-start.x)<=radius&&Math.abs(t.y-start.y)<=radius)found[t.resource]+=t.amount;
 return found;
}
export function walkable(map,x,y){
 const t=at(map,x,y);return !!t&&t.terrain!=="water"&&t.terrain!=="hill"&&t.occupied===null;
}
export function findPath(map,from,to){
 assert(at(map,from.x,from.y)&&at(map,to.x,to.y),"Path endpoint outside map");
 if(!walkable(map,to.x,to.y)||!walkable(map,from.x,from.y))return null;
 const queue=[from],prev=new Map([[key(from.x,from.y),null]]);
 for(let head=0;head<queue.length;head++){
   const p=queue[head];
   if(p.x===to.x&&p.y===to.y){
     const path=[];let k=key(p.x,p.y);
     while(k!==null){const [x,y]=k.split(",").map(Number);path.push({x,y});k=prev.get(k);}
     return path.reverse();
   }
   for(const [dx,dy] of CARDINAL){
     const x=p.x+dx,y=p.y+dy,k=key(x,y);
     if(!prev.has(k)&&walkable(map,x,y)){prev.set(k,key(p.x,p.y));queue.push({x,y});}
   }
 }
 return null;
}
export function canPlace(map,x,y,width,height){
 if(![x,y,width,height].every(Number.isInteger)||width<1||height<1)return false;
 for(let dy=0;dy<height;dy++)for(let dx=0;dx<width;dx++){
   const t=at(map,x+dx,y+dy);
   if(!t||t.terrain!=="grass"||t.occupied!==null)return false;
 }
 return true;
}
export function placeBuilding(map,{owner,kind,x,y,width=2,height=2}){
 assert(typeof owner==="string"&&typeof kind==="string","Invalid building identity");
 // Grid-snapped placement to keep wall and building collision deterministic.
 x=Math.round(x);y=Math.round(y);
 assert(canPlace(map,x,y,width,height),"Invalid building placement");
 const id="structure-"+map.nextBuilding++;
 const structure={id,owner,kind,x,y,width,height};
 for(let dy=0;dy<height;dy++)for(let dx=0;dx<width;dx++)at(map,x+dx,y+dy).occupied=id;
 map.structures.push(structure);
 return clone(structure);
}
export function removeBuilding(map,id){
 const i=map.structures.findIndex(s=>s.id===id);assert(i>=0,"Structure missing");
 const [s]=map.structures.splice(i,1);
 for(let dy=0;dy<s.height;dy++)for(let dx=0;dx<s.width;dx++)at(map,s.x+dx,s.y+dy).occupied=null;
 return s;
}
export function mapChecksum(map){return hash(map);}
export function asciiMap(map){
 const chars={grass:".",water:"~",forest:"T",hill:"^",deposit:"*"};
 const startSet=new Map(map.starts.map((s,i)=>[key(s.x,s.y),String(i+1)]));
 return Array.from({length:map.height},(_,y)=>Array.from({length:map.width},(_,x)=>{
   const t=at(map,x,y);return startSet.get(key(x,y))??(t.occupied?"#":chars[t.terrain]);
 }).join("")).join("\n");
}
