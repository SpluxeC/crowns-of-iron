import {assert} from "./util.js";
import {getPlayer} from "./state.js";
import {at} from "./map.js";
import {issueMove} from "./battlefield.js";
import {pathForUnit} from "./movementDomains.js";
import {researchMultiplier} from "./technologyEffects.js";
const DOCKS=new Set(["Dock","Shipyard","Advanced Shipyard"]);
const near=(a,b)=>Math.abs(a.x-b.x)+Math.abs(a.y-b.y);
function embarkPoints(match,siteId){
 const site=match.constructions?.[siteId];
 const s=match.battlefield?.structures.find(s=>s.id===siteId);
 assert(site?.completed&&s&&DOCKS.has(site.kind),"Dock unavailable");
 const points=[];
 for(let y=s.y-1;y<=s.y+s.height;y++)for(let x=s.x-1;x<=s.x+s.width;x++){
  const tile=at(match.battlefield,x,y);
  if(tile?.terrain!=="water"||tile.occupied!==null)continue;
  if(x>=s.x&&x<s.x+s.width&&y>=s.y&&y<s.y+s.height)continue;
  points.push({x,y});
 }
 assert(points.length>0,"Dock lacks navigable water");
 return points.sort((a,b)=>a.y-b.y||a.x-b.x);
}
export function assignSeaTrade(match,owner,vesselId,fromSite,toSite){
 assert(match.battlefield,"Trading needs battlefield");
 const player=getPlayer(match,owner);
 const vessel=player.units.find(u=>u.id===vesselId&&u.alive&&
  u.archetype==="Trade Ship"&&Number.isInteger(u.x));
 assert(vessel,"Owned positioned Trade Ship required");
 assert(fromSite!==toSite,"Trade route needs two different docks");
 for(const id of [fromSite,toSite]){
  const site=match.constructions?.[id];
  const holder=match.players.find(p=>p.id===site?.owner);
  assert(site?.completed&&holder?.team===player.team,"Trade dock must be allied and completed");
 }
 const from=embarkPoints(match,fromSite).find(p=>near(p,vessel)<=1);
 assert(from,"Trade vessel must start near its departure dock");
 const destination=embarkPoints(match,toSite).find(p=>
   pathForUnit(match,owner,vessel.archetype,{x:vessel.x,y:vessel.y},p));
 assert(destination,"Trade route is disconnected");
 match.seaTradeJobs??={};
 match.seaTradeJobs[vesselId]={owner,fromSite,toSite,targetSite:toSite,
  target:destination,completed:0,fraction:0};
 issueMove(match,owner,vesselId,destination.x,destination.y);
 return {vesselId,fromSite,toSite};
}
export function cancelSeaTrade(match,owner,vesselId){
 const job=match.seaTradeJobs?.[vesselId];
 assert(job&&job.owner===owner,"Sea trade job not owned");
 delete match.seaTradeJobs[vesselId];
 return true;
}
export function tickNavalEconomy(match,deltaMs){
 if(!match.battlefield||match.economyMode!=="spatial")return [];
 const events=[];
 for(const p of match.players){
  if(p.defeated)continue;
  for(const vessel of p.units.filter(u=>u.alive&&u.archetype==="Fishing Vessel"&&
   Number.isInteger(u.x))){
   const shoal=match.battlefield.fishShoals?.find(s=>s.amount>0&&
      near(s,vessel)<=2);
   if(!shoal)continue;
   vessel.fishProgressMs=(vessel.fishProgressMs??0)+deltaMs;
   vessel.fishFraction??=0;
   while(vessel.fishProgressMs>=10000&&shoal.amount>0){
    vessel.fishProgressMs-=10000;
    const raw=12*researchMultiplier(p,"fishOutput");
    const n=Math.min(shoal.amount,Math.floor(raw+vessel.fishFraction+1e-9));
    vessel.fishFraction+=raw-Math.floor(raw+vessel.fishFraction+1e-9);
    shoal.amount-=n;p.resources.Food+=n;
    events.push({kind:"fishing",owner:p.id,unitId:vessel.id,amount:n});
   }
  }
 }
 for(const [vesselId,job] of Object.entries(match.seaTradeJobs??{}).sort(([a],[b])=>a.localeCompare(b))){
  const player=match.players.find(p=>p.id===job.owner);
  const vessel=player?.units.find(u=>u.id===vesselId&&u.alive&&u.archetype==="Trade Ship");
  if(!vessel||!match.constructions?.[job.fromSite]||!match.constructions?.[job.toSite]){
   delete match.seaTradeJobs[vesselId];continue;
  }
  if(!Number.isInteger(vessel.x))continue;
  if(near(vessel,job.target)>0){
   // Orders can be interrupted by manual commands. Resume only after explicit reassignment.
   continue;
  }
  const factor=researchMultiplier(player,"tradeRevenue");
  const raw=40*factor+job.fraction,award=Math.floor(raw+1e-9);
  job.fraction=raw-award;player.resources.Gold+=award;job.completed++;
  events.push({kind:"seaTrade",owner:player.id,unitId:vessel.id,amount:award});
  job.targetSite=job.targetSite===job.fromSite?job.toSite:job.fromSite;
  const next=embarkPoints(match,job.targetSite).find(point=>
    pathForUnit(match,job.owner,"Trade Ship",{x:vessel.x,y:vessel.y},point));
  if(!next){delete match.seaTradeJobs[vesselId];continue;}
  job.target=next;issueMove(match,job.owner,vesselId,next.x,next.y);
 }
 return events;
}
