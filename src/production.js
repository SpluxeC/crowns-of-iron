import {ALL_ARCHETYPES} from "./extendedCatalog.js";
import {makeUnit,nextId} from "./state.js";
import {assert,ageIndex,spend,refund} from "./util.js";
import {refreshUnitTechnology} from "./technologyEffects.js";
import {spawnUnitOnDomain,findAvailableSpawnPosition} from "./movementDomains.js";
import {researchMultiplier} from "./technologyEffects.js";
export const PRODUCTION_LOCATIONS={
"Worker":["Town Center"],"Scout":["Town Center","Training Camp"],
"Club Fighter":["Training Camp"],"Stone Slinger":["Training Camp"],"Stone Spearman":["Training Camp"],
"Swordsman":["Barracks"],"Archer":["Archery Range"],"Pikeman":["Barracks"],"Raider":["Barracks"],
"Heavy Infantry":["Barracks"],"Heavy Mobile":["Barracks"],
"Battering Ram":["Siege Workshop"],"Siege Tower":["Siege Workshop"],
"Healer":["Support Sanctuary"],"Converter":["Support Sanctuary"],"Hero":["Support Sanctuary"],
"Gunner":["Barracks","Foundry"],"Heavy Artillery":["Siege Workshop","Foundry"],
"Anti-Air Infantry":["Barracks"],"Mechanized Infantry":["Foundry","Grand Factory"],
"Heavy War Machine":["Grand Factory"],"Legendary Land":["Grand Factory"],
"Raft":["Dock"],"Fishing Vessel":["Dock"],"Trade Ship":["Dock"],"Transport Ship":["Dock"],
"Light Warship":["Dock","Shipyard"],"Heavy Warship":["Shipyard"],"Naval Siege Ship":["Shipyard"],
"Legendary Warship":["Advanced Shipyard"],"Scout Aircraft":["Airship Hangar"],
"Interceptor":["Airship Hangar"],"Gunship":["Airship Hangar"],"Bomber":["Airship Hangar"],
"Air Transport":["Airship Hangar"],"Aerial Battleship":["Airship Hangar"]
};
export function reserveUnique(player,role){
  const active=player.units.some(u=>u.alive&&u.archetype===role);
  const queued=Object.values(player.unitQueues).some(q=>q.some(j=>j.role===role));
  assert(!active&&!queued,"Unique unit already active or queued");
}
export function queueUnit(player,facility,role,definition=ALL_ARCHETYPES[role]){
  assert(player.alive&&!player.defeated,"Player eliminated");
  const jobs=player.unitQueues[facility];assert(jobs,"Missing production facility");
  assert(definition,"Unknown unit role");
  assert((PRODUCTION_LOCATIONS[role]??[]).includes(facility.split("#")[0]),"Wrong production building");
  assert(ageIndex(player.age)>=ageIndex(definition.age),"Unit age locked");
  assert(jobs.length<10,"Recruitment queue full");
  if(definition.unique)reserveUnique(player,role);
  spend(player.resources,definition.cost);
  const job={role,ms:0,started:false,cost:structuredClone(definition.cost),definition:structuredClone(definition)};
  jobs.push(job);
  return job;
}
export function tickProduction(match,player,deltaMs){
  assert(Number.isSafeInteger(deltaMs)&&deltaMs>=0,"Invalid production interval");
  for(const [facility,jobs] of Object.entries(player.unitQueues)){
    let remaining=deltaMs;
    const site=Object.values(match.constructions??{}).find(s=>s.completed&&s.facilityKey===facility);
    while(jobs.length&&remaining>=0){
      const j=jobs[0],def=j.definition;
      const factory=["Foundry","Grand Factory","Airship Hangar"].includes(facility.split("#")[0]);
      const techFactor=factory?researchMultiplier(player,"production"):1;
      const duration=Math.max(1,Math.ceil(def.ms*(site?.trainTimeFactor??1)/techFactor));
      if(j.ms<duration){
        if(remaining===0)break;
        const step=Math.min(remaining,duration-j.ms);j.ms+=step;remaining-=step;j.started=true;
      }
      if(j.ms<duration)break;
      if(player.popUsed+def.pop>player.popCap)break;
      if(match.unitCollision&&match.battlefield&&
        !findAvailableSpawnPosition(match,player,j.role,facility))break;
      jobs.shift();
      const unit=makeUnit(player,j.role,def,nextId(match));
      refreshUnitTechnology(player,unit);
      spawnUnitOnDomain(match,player,unit,facility);
      player.units.push(unit);player.popUsed+=def.pop;
      player.history.push("Recruited "+unit.name);
      if(remaining===0)break;
    }
  }
}
export function cancelUnit(player,facility,index){
  const jobs=player.unitQueues[facility];assert(jobs&&jobs[index],"No such recruitment");
  const [j]=jobs.splice(index,1);refund(player.resources,j.cost,j.started?.75:1);return j;
}
export function destroyProductionFacility(player,facility){
  const jobs=player.unitQueues[facility];assert(jobs,"No production facility");
  for(const j of jobs)refund(player.resources,j.cost,j.started?.5:1);
  delete player.unitQueues[facility];
}
