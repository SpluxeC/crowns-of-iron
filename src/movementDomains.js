import {assert} from "./util.js";
import {at,walkable} from "./map.js";

const NAVAL=new Set(["Raft","Fishing Vessel","Trade Ship","Transport Ship","Light Warship","Heavy Warship","Naval Siege Ship","Legendary Warship"]);
const AIR=new Set(["Scout Aircraft","Interceptor","Gunship","Bomber","Air Transport","Aerial Battleship"]);
const STEPS=[[0,-1],[1,0],[0,1],[-1,0]];
const key=(x,y)=>x+","+y;
export function movementDomain(role){
 return NAVAL.has(role)?"naval":AIR.has(role)?"air":"land";
}
function openFriendlyGate(match,owner,tile){
 if(!tile?.occupied)return false;
 const site=match.constructions?.[tile.occupied];
 if(!site?.completed||!site.gateOpen||!site.kind.toLowerCase().includes("gate"))return false;
 const viewer=match.players.find(p=>p.id===owner);
 const holder=match.players.find(p=>p.id===site.owner);
 return !!viewer&&!!holder&&viewer.team===holder.team;
}
export function tileTraversable(match,owner,role,x,y){
 const tile=at(match.battlefield,x,y);
 if(!tile)return false;
 const domain=movementDomain(role);
 if(domain==="air")return true;
 if(domain==="naval")return tile.terrain==="water"&&tile.occupied===null;
 return walkable(match.battlefield,x,y)||
   (tile.terrain!=="water"&&tile.terrain!=="hill"&&openFriendlyGate(match,owner,tile));
}
export function pathForUnit(match,owner,role,from,to,{range=0,visible=()=>true,blocked=()=>false}={}){
 const map=match.battlefield;
 assert(map&&at(map,from.x,from.y)&&at(map,to.x,to.y),"Path outside battlefield");
 const domain=movementDomain(role);
 if(!tileTraversable(match,owner,role,from.x,from.y))return null;
 const queue=[{x:from.x,y:from.y}],previous=new Map([[key(from.x,from.y),null]]);
 for(let head=0;head<queue.length;head++){
  const p=queue[head],distance=Math.abs(p.x-to.x)+Math.abs(p.y-to.y);
  if(distance<=range&&visible(p)){
   const path=[];let k=key(p.x,p.y);
   while(k!==null){const [x,y]=k.split(",").map(Number);path.push({x,y});k=previous.get(k);}
   return path.reverse();
  }
  for(const [dx,dy] of STEPS){
   const x=p.x+dx,y=p.y+dy,k=key(x,y);
   if(!previous.has(k)&&tileTraversable(match,owner,role,x,y)&&!blocked(x,y)){
    previous.set(k,key(p.x,p.y));queue.push({x,y});
   }
  }
 }
 return null;
}
/** Pick a domain-legal materialization tile, including collision reservations
 * when opted in. Recruit jobs remain ready rather than stacking in a full base. */
export function findAvailableSpawnPosition(match,player,role,facility){
 const map=match.battlefield;
 if(!map)return null;
 const domain=movementDomain(role),home=map.starts[match.players.indexOf(player)];
 let anchors;
 if(domain==="land")anchors=match.unitCollision?map.tiles:[home];
 else{
  const site=Object.values(match.constructions??{}).find(j=>j.completed&&
    j.owner===player.id&&j.facilityKey===facility);
  const area=map.structures.find(s=>s.id===site?.siteId);
  anchors=[];
  if(area){
   for(let y=area.y-1;y<=area.y+area.height;y++)
    for(let x=area.x-1;x<=area.x+area.width;x++)
     if(at(map,x,y))anchors.push({x,y});
  }else anchors=[home];
 }
 const taken=new Set();
 if(match.unitCollision&&domain!=="air")
  for(const p of match.players)for(const u of p.units)
   if(u.alive&&!u.embarkedAt&&!u.garrisonedAt&&Number.isInteger(u.x)&&
     movementDomain(u.archetype)===domain)taken.add(key(u.x,u.y));
 const valid=anchors.filter(v=>tileTraversable(match,player.id,role,v.x,v.y)&&
  !taken.has(key(v.x,v.y))).sort((a,b)=>
   (Math.abs(a.x-home.x)+Math.abs(a.y-home.y))-
   (Math.abs(b.x-home.x)+Math.abs(b.y-home.y))||
   a.y-b.y||a.x-b.x);
 return valid[0]??null;
}
export function spawnUnitOnDomain(match,player,unit,facility){
 if(!match.battlefield)return;
 const spot=findAvailableSpawnPosition(match,player,unit.archetype,facility);
 unit.x=spot?.x??null;unit.y=spot?.y??null;
}
