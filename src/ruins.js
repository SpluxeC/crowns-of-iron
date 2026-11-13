import {assert,affordable,spend,refund,clone} from "./util.js";
import {at,canPlace} from "./map.js";
import {getPlayer} from "./state.js";
import {STRUCTURES,startConstruction,destroyStructure} from "./construction.js";

// Ruins persist for five minutes. Only one outcome is permitted:
// salvage or rebuild. New construction at the same location invalidates the ruin.
const RUIN_MS=300000;
const materialKeys=["Wood","Stone","Metal"];
export function destroyToRuin(match,siteId){
  const job=match.constructions?.[siteId];
  assert(job&&job.completed,"Only completed structures leave ruins");
  const placement=match.battlefield?.structures?.find(s=>s.id===siteId);
  assert(placement,"Structure footprint is unavailable");
  const building=clone(job),location=clone(placement);
  destroyStructure(match,siteId);
  match.ruins??={};
  match.ruins[siteId]={siteId,owner:building.owner,kind:building.kind,
    x:location.x,y:location.y,width:location.width,height:location.height,
    expiresAtMs:match.elapsedMs+RUIN_MS,consumed:false};
  return match.ruins[siteId];
}
function activeRuin(match,owner,siteId){
  const ruin=match.ruins?.[siteId];
  assert(ruin&&ruin.owner===owner&&!ruin.consumed,"Ruin not available");
  assert(match.elapsedMs<ruin.expiresAtMs,"Ruin expired");
  return ruin;
}
function blocked(match,ruin){
  return !canPlace(match.battlefield,ruin.x,ruin.y,ruin.width,ruin.height);
}
export function salvageRuin(match,owner,siteId){
  const ruin=activeRuin(match,owner,siteId);
  assert(!blocked(match,ruin),"Ruin site has been reused");
  const def=STRUCTURES[ruin.kind];assert(def,"Unknown original structure");
  const ratio=["Grand Factory","Foundry","Airship Hangar"].includes(ruin.kind)?.20:
    ["Shelter","Resource Depot","Training Camp"].includes(ruin.kind)?.10:.15;
  const materials=Object.fromEntries(materialKeys.map(k=>[k,Math.floor((def.cost[k]??0)*ratio)]));
  const p=getPlayer(match,owner);
  refund(p.resources,materials,1);
  ruin.consumed=true;
  delete match.ruins[siteId];
  return materials;
}
export function rebuildRuin(match,owner,siteId,workerIds){
  const ruin=activeRuin(match,owner,siteId);
  assert(!blocked(match,ruin),"Ruin site has been reused");
  const def=STRUCTURES[ruin.kind];assert(def,"Unknown original building");
  const discounted=Object.fromEntries(Object.entries(def.cost).map(([key,v])=>[key,Math.ceil(v*.75)]));
  const p=getPlayer(match,owner);
  assert(affordable(p.resources,discounted),"Insufficient reconstruction resources");
  // startConstruction validates pathing/age/staff/placement and charges full cost.
  // Temporarily credit the discount so a player needs only the reduced price.
  const credit=Object.fromEntries(Object.entries(def.cost).map(([key,v])=>[key,v-discounted[key]]));
  refund(p.resources,credit,1);
  let newId;
  try{
    newId=startConstruction(match,owner,ruin.kind,ruin.x,ruin.y,workerIds);
  }catch(error){
    spend(p.resources,credit);throw error;
  }
  const job=match.constructions[newId];
  job.cost=discounted;job.durationMs=Math.ceil(def.ms*.70);
  ruin.consumed=true;
  delete match.ruins[siteId];
  return newId;
}
export function tickRuins(match){
  for(const [id,ruin] of Object.entries(match.ruins??{})){
    if(match.elapsedMs>=ruin.expiresAtMs||blocked(match,ruin))delete match.ruins[id];
  }
}
