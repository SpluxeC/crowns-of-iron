import {assignHarvestJob} from "./spatialEconomy.js";
import {findPath,walkable} from "./map.js";
import {getPlayer} from "./state.js";

const PRIORITIES={
 I:["Food","Wood","Stone","Food","Wood","Gold"],
 II:["Food","Wood","Stone","Metal","Gold"],
 III:["Food","Metal","Wood","Stone","Gold"],
 IV:["Food","Metal","Gold","Wood","Stone","Aether"],
 V:["Food","Gold","Metal","Aether","Stone","Wood"]
};
export function assignSpatialBotWorker(match,owner){
 if(match.economyMode!=="spatial"||!match.battlefield)return null;
 const p=getPlayer(match,owner),jobs=match.harvestJobs??{};
 const busy=new Set(Object.values(match.constructions??{}).filter(s=>!s.completed&&s.owner===owner)
  .flatMap(s=>s.workerIds));
 const workers=p.units.filter(u=>u.alive&&u.archetype==="Worker"&&
  Number.isInteger(u.x)&&!jobs[u.id]&&!busy.has(u.id)&&!(u.cargo?.amount>0));
 if(!workers.length)return null;
 const current=Object.fromEntries((PRIORITIES[p.age]??PRIORITIES.I).map(r=>[r,0]));
 for(const [id,job] of Object.entries(jobs))if(job.owner===owner){
  const tile=match.battlefield.tiles.find(t=>t.x===job.x&&t.y===job.y);
  if(tile?.resource)current[tile.resource]=(current[tile.resource]??0)+1;
 }
 const priority=[...new Set(PRIORITIES[p.age]??PRIORITIES.I)]
  .sort((a,b)=>(current[a]??0)-(current[b]??0)||
    (PRIORITIES[p.age]??PRIORITIES.I).indexOf(a)-(PRIORITIES[p.age]??PRIORITIES.I).indexOf(b));
 for(const worker of workers){
  for(const resource of priority){
   const sites=match.battlefield.tiles.filter(t=>t.resource===resource&&t.amount>0&&
     walkable(match.battlefield,t.x,t.y))
     .sort((a,b)=>(Math.abs(worker.x-a.x)+Math.abs(worker.y-a.y))-
       (Math.abs(worker.x-b.x)+Math.abs(worker.y-b.y))||a.y-b.y||a.x-b.x);
   for(const site of sites){
    if(!findPath(match.battlefield,{x:worker.x,y:worker.y},{x:site.x,y:site.y}))continue;
    try{
      assignHarvestJob(match,owner,worker.id,site.x,site.y);
      return {workerId:worker.id,resource,x:site.x,y:site.y};
    }catch(e){
      if(/unreachable|age locked|No viable/.test(e.message))continue;
      throw e;
    }
   }
  }
 }
 return null;
}
