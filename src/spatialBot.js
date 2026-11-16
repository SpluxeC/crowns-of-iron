/** Deterministic, age-aware AI resource allocation. Workers physically collect
 * and return finite cargo; resource selection never credits free inventory. */
import {assignHarvestJob} from "./spatialEconomy.js";
import {findPath,walkable} from "./map.js";
import {getPlayer} from "./state.js";
import {ageResearchDeficit} from "./botResearchPlanner.js";
const PRIORITIES={
 I:["Food","Wood","Stone","Gold"],
 II:["Food","Wood","Stone","Metal","Gold"],
 III:["Food","Metal","Wood","Stone","Gold"],
 IV:["Food","Metal","Gold","Wood","Stone","Aether"],
 V:["Food","Gold","Metal","Aether","Stone","Wood"]
};
const BASE_WEIGHTS={
 I:{Food:34,Wood:27,Stone:12,Gold:3},
 II:{Food:35,Wood:20,Stone:16,Metal:18,Gold:9},
 III:{Food:28,Metal:24,Wood:18,Stone:14,Gold:18},
 IV:{Food:22,Metal:26,Gold:18,Wood:12,Stone:12,Aether:5},
 V:{Food:19,Metal:22,Gold:18,Wood:11,Stone:12,Aether:14}
};
export function resourcePriorities(match,owner){
 const p=getPlayer(match,owner),resources=PRIORITIES[p.age]??PRIORITIES.I;
 const deficits=match.fullCatalog?ageResearchDeficit(match,p):{};
 const counts=Object.fromEntries(resources.map(k=>[k,0]));
 for(const job of Object.values(match.harvestJobs??{})){
  if(job.owner!==owner)continue;
  const tile=match.battlefield.tiles[job.y*match.battlefield.width+job.x];
  if(tile?.resource&&tile.resource in counts)counts[tile.resource]++;
 }
 const score=resource=>(
  (BASE_WEIGHTS[p.age]?.[resource]??5)+Math.min(300,(deficits[resource]??0)*1.4)
 )/(1+counts[resource]*.9);
 return [...resources].sort((a,b)=>score(b)-score(a)||
  resources.indexOf(a)-resources.indexOf(b));
}
/** Prefer an uncovered mandatory input over resources already being harvested.
 * Never reassign a loaded worker or steal the only worker covering another
 * mandatory deficit. This plans an existing worker job, not free inventory. */
export function uncoveredMandatoryResource(priority,deficits,assignedResources){
 return priority.find(resource=>(deficits[resource]??0)>0&&
  !assignedResources.includes(resource))??null;
}
export function harvestResourceOptions(priority,forcedResource=null){
 return forcedResource===null?[...priority]:[forcedResource];
}
export function assignSpatialBotWorker(match,owner){
 if(match.economyMode!=="spatial"||!match.battlefield)return null;
 const p=getPlayer(match,owner),jobs=match.harvestJobs??{},
  busy=new Set(Object.values(match.constructions??{})
   .filter(s=>!s.completed&&s.owner===owner).flatMap(s=>s.workerIds));
 const workers=p.units.filter(u=>u.alive&&u.archetype==="Worker"&&
  Number.isInteger(u.x)&&!busy.has(u.id));
 const eligible=workers.filter(u=>!jobs[u.id]&&!(u.cargo?.amount>0));
 const priority=resourcePriorities(match,owner);
 let reassignedWorkerId=null,requiredResource=null;
 // If all workers are busy on optional resources, rebalance an empty-handed
 // worker only when mandatory tech has an unmet resource requirement.
 if(!eligible.length&&match.fullCatalog){
  const deficits=ageResearchDeficit(match,p);
  const assigned=workers.map(u=>{
   const job=jobs[u.id];
   return job?match.battlefield.tiles[job.y*match.battlefield.width+job.x]?.resource:null;
  }).filter(Boolean);
  const needed=uncoveredMandatoryResource(priority,deficits,assigned);
  if(needed){
   const candidate=workers.filter(u=>{
    const job=jobs[u.id];if(!job||u.cargo?.amount>0||job.phase!=="harvest")return false;
    if(match.elapsedMs-(job.assignedAtMs??0)<20000)return false;
    const tile=match.battlefield.tiles[job.y*match.battlefield.width+job.x];
    return (deficits[tile?.resource]??0)===0;
   }).sort((a,b)=>a.id.localeCompare(b.id))[0];
   if(candidate){eligible.push(candidate);reassignedWorkerId=candidate.id;requiredResource=needed;}
  }
 }
 for(const worker of eligible){
  // An already-assigned worker is rebalanced *only* for the uncovered
  // mandatory input. Otherwise the generic preference loop could send it
  // back to the same optional resource and indefinitely stall advancement.
  for(const resource of harvestResourceOptions(priority,
   worker.id===reassignedWorkerId?requiredResource:null)){
   const sites=match.battlefield.tiles.filter(t=>t.resource===resource&&t.amount>0&&
    walkable(match.battlefield,t.x,t.y)).sort((a,b)=>
     Math.abs(worker.x-a.x)+Math.abs(worker.y-a.y)-
     Math.abs(worker.x-b.x)-Math.abs(worker.y-b.y)||a.y-b.y||a.x-b.x);
   for(const site of sites){
    if(!findPath(match.battlefield,{x:worker.x,y:worker.y},{x:site.x,y:site.y}))continue;
    try{
     assignHarvestJob(match,owner,worker.id,site.x,site.y);
     match.harvestJobs[worker.id].assignedAtMs=match.elapsedMs;
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
