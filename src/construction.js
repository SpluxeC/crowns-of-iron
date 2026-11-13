import {assert,affordable,spend,refund,ageIndex} from "./util.js";
import {at,canPlace,placeBuilding,removeBuilding,findPath} from "./map.js";
import {getPlayer,addFacility} from "./state.js";
import {destroyResearchFacility} from "./research.js";
import {destroyProductionFacility} from "./production.js";
import {refundDestroyedBuildingUpgrades} from "./buildingUpgrades.js";
import {constructionDefinition} from "./structureCatalog.js";
import {addMonument,removeMonument} from "./modes.js";
import {refreshStructureTechnology} from "./technologyEffects.js";
import {isCoastalStructure,validCoastalPlacement} from "./coastal.js";
import {evacuateGarrison} from "./fortifications.js";

export const STRUCTURES=Object.freeze({
  "Training Camp":{age:"I",cost:{Wood:100,Stone:40},ms:40000,footprint:[3,3],hp:800,armor:5},
  Shelter:{age:"I",cost:{Wood:60},ms:24000,footprint:[2,2],hp:450,armor:2,housing:5},
  "Resource Depot":{age:"I",cost:{Wood:75},ms:28000,footprint:[3,3],hp:550,armor:3},
  Barracks:{age:"II",cost:{Wood:130,Stone:60,Metal:20},ms:50000,footprint:[4,4],hp:1050,armor:8},
  "Archery Range":{age:"II",cost:{Wood:130,Stone:35,Gold:20},ms:50000,footprint:[4,4],hp:850,armor:6},
  Forge:{age:"II",cost:{Wood:120,Stone:70,Metal:30},ms:55000,footprint:[4,4],hp:900,armor:8},
  Farm:{age:"II",cost:{Wood:70},ms:30000,footprint:[3,3],hp:400,armor:2},
  "Siege Workshop":{age:"III",cost:{Wood:180,Stone:90},ms:65000,footprint:[5,4],hp:1100,armor:10},
  "Support Sanctuary":{age:"III",cost:{Wood:140,Stone:80,Gold:60},ms:60000,footprint:[4,4],hp:950,armor:8},
  "Field Hospital":{age:"III",cost:{Wood:140,Stone:90,Gold:60},ms:50000,footprint:[4,4],hp:900,armor:6},
  Academy:{age:"III",cost:{Wood:150,Stone:100,Metal:60,Gold:50},ms:60000,footprint:[4,4],hp:950,armor:8},
  Foundry:{age:"IV",cost:{Wood:160,Stone:90,Metal:180,Gold:90},ms:85000,footprint:[5,5],hp:1550,armor:16},
  "Airship Hangar":{age:"IV",cost:{Wood:180,Stone:100,Metal:260,Gold:180},ms:95000,footprint:[6,6],hp:1650,armor:15},
  "Grand Factory":{age:"V",cost:{Wood:150,Stone:120,Metal:330,Gold:190,Aether:50},ms:115000,footprint:[6,6],hp:2400,armor:24}
});
export function startConstruction(match,owner,kind,x,y,workerIds){
  const map=match.battlefield;assert(map,"Battlefield required");
  const p=getPlayer(match,owner);
  const def=constructionDefinition(match,p,kind,STRUCTURES);assert(def,"Unknown building type");
  if(kind==="Reinforced Stone Wall")assert(p.completed.includes("BLD-04"),"Strengthened Stone Wall research required");
  assert(ageIndex(p.age)>=ageIndex(def.age),"Building age locked");
  assert(Array.isArray(workerIds)&&workerIds.length>0&&new Set(workerIds).size===workerIds.length,"Invalid worker assignment");
  const workers=workerIds.map(id=>p.units.find(u=>u.id===id&&u.alive&&u.archetype==="Worker"));
  assert(workers.every(Boolean),"Construction requires live workers");
  match.constructions??={};
  const busy=new Set(Object.values(match.constructions).filter(site=>!site.completed)
    .flatMap(site=>site.workerIds));
  assert(workerIds.every(id=>!busy.has(id)),"Worker already assigned to a construction site");
  [x,y]=[Math.round(x),Math.round(y)];
  const [width,height]=def.footprint;
  assert(canPlace(map,x,y,width,height),"Invalid building placement");
  if(isCoastalStructure(kind))assert(validCoastalPlacement(map,x,y,width,height),"Coastal building requires adjacent water");
  assert(workers.every(w=>Number.isInteger(w.x)&&findPath(map,{x:w.x,y:w.y},{x,y})),"Workers cannot reach site");
  assert(affordable(p.resources,def.cost),"Insufficient resources");
  spend(p.resources,def.cost);
  const site=placeBuilding(map,{owner,kind,x,y,width,height});
  match.constructions??={};
  match.constructions[site.id]={siteId:site.id,owner,kind,workerIds:[...workerIds],elapsedMs:0,
    durationMs:def.ms,cost:structuredClone(def.cost),hp:def.hp,maxHp:def.hp,armor:def.armor,
    housing:def.housing??0,completed:false};
  return site.id;
}
export function cancelConstruction(match,owner,siteId){
  const job=match.constructions?.[siteId];
  assert(job&&job.owner===owner&&!job.completed,"No cancellable site");
  const p=getPlayer(match,owner);
  refund(p.resources,job.cost,job.elapsedMs>0?.75:1);
  removeBuilding(match.battlefield,siteId);
  delete match.constructions[siteId];return true;
}
export function tickConstruction(match,deltaMs){
  if(!match.battlefield)return;
  for(const siteId of Object.keys(match.constructions??{}).sort()){
    const job=match.constructions[siteId];
    if(job.completed)continue;
    const p=getPlayer(match,job.owner);
    if(p.defeated)continue;
    const staff=job.workerIds.filter(id=>p.units.some(u=>u.id===id&&u.alive&&u.archetype==="Worker"));
    if(!staff.length)continue;
    // Additional builders are useful with diminishing returns.
    const bonus=1+.35*(Math.min(staff.length,8)-1);
    job.elapsedMs+=Math.floor(deltaMs*bonus);
    if(job.elapsedMs>=job.durationMs){
      job.elapsedMs=job.durationMs;job.completed=true;
      job.facilityKey=addFacility(p,job.kind);
      refreshStructureTechnology(match,p);
      p.history.push("Built "+job.kind+" at "+siteId);
      if(job.housing)p.popCap=Math.min(300,p.popCap+job.housing);
      if(job.kind==="Great Monument"&&match.mode==="GreatMonument")addMonument(match,job.owner);
    }
  }
}
export function destroyStructure(match,siteId){
  const job=match.constructions?.[siteId];assert(job,"Unknown constructed structure");
  const p=getPlayer(match,job.owner);
  if(!job.completed){return cancelConstruction(match,job.owner,siteId);}
  evacuateGarrison(match,job);
  if(job.facilityKey){
    refundDestroyedBuildingUpgrades(p,job);
    if(p.unitQueues[job.facilityKey])destroyProductionFacility(p,job.facilityKey);
    if(p.researchQueues[job.facilityKey])destroyResearchFacility(p,job.facilityKey);
    p.facilities[job.kind]=Math.max(0,(p.facilities[job.kind]??0)-1);
  }
  const gainedHousing=(job.housing??0)+(job.upgradeHousing??0);
  if(gainedHousing)p.popCap=Math.max(0,p.popCap-gainedHousing);
  if(job.kind==="Great Monument"&&match.mode==="GreatMonument"&&match.modeState?.monuments?.[job.owner])
    removeMonument(match,job.owner);
  removeBuilding(match.battlefield,siteId);
  delete match.constructions[siteId];return true;
}
