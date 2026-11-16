import {assert} from "./util.js";
import {at,findPath,walkable} from "./map.js";
import {getPlayer} from "./state.js";
import {issueMove} from "./battlefield.js";
import {researchMultiplier} from "./technologyEffects.js";
export function setEconomyMode(match,mode){
 assert(["abstract","spatial"].includes(mode),"Unknown economy mode");
 assert(match.elapsedMs===0&&match.tick===0,"Economy mode must be configured before play");
 assert(match.battlefield||mode==="abstract","Spatial economy requires a battlefield");
 match.economyMode=mode;
 match.harvestJobs={};
 return mode;
}
function qualifies(player,resource){
 return (resource!=="Metal"||player.age!=="I")&&
   (resource!=="Aether"||["III","IV","V"].includes(player.age));
}
function cargo(worker){worker.cargo??={resource:null,amount:0};return worker.cargo;}
/** Valid drop-off approaches. Town Center is a logical drop-off around its
 * starting tile; older saves may have structures covering its exact center.
 * Never route a loaded worker to a tile that is now a building. */
export function dropoffCandidates(match,owner){
 const p=getPlayer(match,owner),map=match.battlefield;
 const start=map.starts[match.players.indexOf(p)],points=[],seen=new Set();
 function add(x,y){
  if(!walkable(map,x,y))return;
  const k=x+","+y;if(seen.has(k))return;seen.add(k);points.push({x,y});
 }
 // Prefer the Town Center origin, then a small pedestrian approach ring.
 add(start.x,start.y);
 for(let radius=1;radius<=3;radius++)
  for(let dy=-radius;dy<=radius;dy++)
   for(let dx=-radius;dx<=radius;dx++)
    if(Math.max(Math.abs(dx),Math.abs(dy))===radius)
     add(start.x+dx,start.y+dy);
 for(const site of map.structures.filter(s=>s.owner===owner&&
  match.constructions?.[s.id]?.completed&&s.kind==="Resource Depot")){
  for(let y=site.y-1;y<=site.y+site.height;y++)
   for(let x=site.x-1;x<=site.x+site.width;x++)
    if(x===site.x-1||x===site.x+site.width||
       y===site.y-1||y===site.y+site.height)add(x,y);
 }
 return points;
}
function home(match,owner,unit){
 if(!Number.isInteger(unit.x)||!Number.isInteger(unit.y))return null;
 const map=match.battlefield;
 const options=dropoffCandidates(match,owner).map(point=>{
  const path=findPath(map,{x:unit.x,y:unit.y},point);
  return path?{...point,steps:path.length-1}:null;
 }).filter(Boolean);
 options.sort((a,b)=>a.steps-b.steps||a.y-b.y||a.x-b.x);
 return options[0]??null;
}
function canDeliverHere(match,owner,worker){
 return dropoffCandidates(match,owner).some(p=>
  Math.abs(worker.x-p.x)+Math.abs(worker.y-p.y)<=1);
}
export function assignHarvestJob(match,owner,workerId,x,y){
 assert(match.economyMode==="spatial","Spatial harvesting mode is not enabled");
 const player=getPlayer(match,owner);
 const worker=player.units.find(u=>u.id===workerId&&u.alive&&u.archetype==="Worker");
 assert(worker&&Number.isInteger(worker.x),"Living owned positioned worker required");
 assert(Number.isInteger(x)&&Number.isInteger(y),"Invalid deposit coordinates");
 const tile=at(match.battlefield,x,y);
 assert(tile?.resource&&tile.amount>0,"No viable deposit");
 assert(qualifies(player,tile.resource),"Deposit is age locked");
 assert(walkable(match.battlefield,x,y)&&findPath(match.battlefield,
   {x:worker.x,y:worker.y},{x,y}),"Deposit is unreachable");
 const held=cargo(worker);
 assert(!held.amount||held.resource===tile.resource,"Deliver existing cargo before switching resource");
 match.harvestJobs??={};
 match.harvestJobs[workerId]={owner,x,y,phase:held.amount?"return":"harvest"};
 if(held.amount)issueMove(match,owner,workerId,home(match,owner,worker).x,home(match,owner,worker).y);
 else issueMove(match,owner,workerId,x,y);
 return match.harvestJobs[workerId];
}
export function cancelHarvestJob(match,owner,workerId){
 const job=match.harvestJobs?.[workerId];
 assert(job&&job.owner===owner,"Worker has no owned harvest job");
 delete match.harvestJobs[workerId];
 return true;
}
export function deliverCargo(match,owner,workerId){
 const p=getPlayer(match,owner);
 const worker=p.units.find(u=>u.id===workerId&&u.alive&&u.archetype==="Worker");
 assert(worker,"Owned worker unavailable");
 const held=cargo(worker),target=home(match,owner,worker);
 assert(target&&canDeliverHere(match,owner,worker),"Worker is not at a depot");
 if(!held.amount)return 0;
 p.resources[held.resource]+=held.amount;
 const amount=held.amount;held.amount=0;held.resource=null;
 const depot=match.battlefield.structures.find(site=>site.owner===owner&&site.kind==="Resource Depot"&&
    match.constructions?.[site.id]?.completed&&
    Math.abs(worker.x-site.x)+Math.abs(worker.y-site.y)<=3);
 const handling=depot?match.constructions[depot.id].localDropoffMultiplier??1:1;
 worker.nextDeliveryAtMs=match.elapsedMs+Math.ceil(1000/(researchMultiplier(p,"dropoff")*handling));
 return amount;
}
function travel(match,owner,worker,target){
 if(!target||!walkable(match.battlefield,target.x,target.y))return;
 const active=match.orders?.[worker.id];
 if(active?.kind==="move"&&active.destination?.x===target.x&&active.destination?.y===target.y)return;
 try{issueMove(match,owner,worker.id,target.x,target.y);}catch{ /* unreachable: retry only on reassignment */ }
}
export function tickSpatialHarvest(match){
 if(match.economyMode!=="spatial")return;
 for(const [workerId,job] of Object.entries(match.harvestJobs??{}).sort(([a],[b])=>a.localeCompare(b))){
   const p=match.players.find(v=>v.id===job.owner);
   const worker=p?.units.find(u=>u.id===workerId&&u.alive&&u.archetype==="Worker");
   if(!worker){delete match.harvestJobs[workerId];continue;}
   const tile=at(match.battlefield,job.x,job.y);
   const held=cargo(worker),base=home(match,job.owner,worker);
   if(job.phase==="return"){
     if(base&&canDeliverHere(match,job.owner,worker)&&
       (worker.nextDeliveryAtMs??0)<=match.elapsedMs){
       deliverCargo(match,job.owner,workerId);
       if(!tile?.resource||tile.amount<=0){delete match.harvestJobs[workerId];continue;}
       job.phase="harvest";travel(match,job.owner,worker,{x:job.x,y:job.y});
     }else travel(match,job.owner,worker,base);
     continue;
   }
   if(!tile?.resource||tile.amount<=0){
     if(held.amount){job.phase="return";travel(match,job.owner,worker,base);}
     else delete match.harvestJobs[workerId];
     continue;
   }
   if(!qualifies(p,tile.resource))continue;
   if(Math.abs(worker.x-job.x)+Math.abs(worker.y-job.y)>1){
     travel(match,job.owner,worker,{x:job.x,y:job.y});continue;
   }
   if((worker.nextHarvestAtMs??0)>match.elapsedMs)continue;
   const capacity=Math.floor(30*researchMultiplier(p,"carry"));
   const amount=Math.min(10,tile.amount,capacity-held.amount);
   if(amount>0){
     held.resource=tile.resource;held.amount+=amount;tile.amount-=amount;
     worker.nextHarvestAtMs=match.elapsedMs+2000;
     if(tile.amount===0)tile.resource=null;
   }
   if(held.amount>=capacity||tile.amount===0){
     job.phase="return";travel(match,job.owner,worker,base);
   }
 }
}
