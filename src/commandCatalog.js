import {assert,ageIndex,affordable} from "./util.js";
import {getPlayer} from "./state.js";
import {allConstructionTypes} from "./structureCatalog.js";
import {STRUCTURES} from "./construction.js";
import {PRODUCTION_LOCATIONS} from "./production.js";
import {unitDefinition,researchCatalog} from "./fullCatalog.js";
import {knownResearch} from "./research.js";
import {ALL_ARCHETYPES} from "./extendedCatalog.js";
import {displayName} from "./catalog.js";

const AGE=["I","II","III","IV","V"];
function legalAge(player,age){return ageIndex(player.age)>=ageIndex(age);}
function costCopy(def){return Object.fromEntries(Object.entries(def.cost??{})
 .filter(([_,amount])=>amount>0).map(([name,n])=>[name,n]));}
function stages(player,def){return {ageUnlocked:legalAge(player,def.age),
 affordable:affordable(player.resources,def.cost??{})};}
/** A read-only, per-player, authoritative option snapshot.
 * No enemy private data, tokens, raw catalog, or executable definitions leave the host.
 * Clients may display options but must never be trusted to enforce them. */
export function playerCommandCatalog(match,playerId){
 const player=getPlayer(match,playerId);
 const buildings=Object.entries(allConstructionTypes(match,player,STRUCTURES))
  .sort(([a],[b])=>a.localeCompare(b)).map(([kind,def])=>({
   kind,age:def.age,cost:costCopy(def),footprint:[...def.footprint],
   durationMs:def.ms,description:String(def.description??"").slice(0,200),
   ...stages(player,def)
  }));
 const training=[];
 for(const facility of Object.keys(player.unitQueues??{}).sort()){
  const base=facility.split("#")[0],jobs=player.unitQueues[facility];
  for(const role of Object.keys(ALL_ARCHETYPES)){
   if(!(PRODUCTION_LOCATIONS[role]??[]).includes(base))continue;
   const def=unitDefinition(match,player,role);
   if(!def)continue;
   const uniqueBlock=!!def.unique&&(
    player.units.some(u=>u.alive&&u.archetype===role)||
    Object.values(player.unitQueues).some(q=>q.some(j=>j.role===role)));
   training.push({facility,role,name:def.name??displayName(player.faction,role),
    age:def.age,cost:costCopy(def),durationMs:def.ms,pop:def.pop,
    queued:jobs.length,available:legalAge(player,def.age)&&
     affordable(player.resources,def.cost??{})&&jobs.length<10&&!uniqueBlock&&
     player.alive&&!player.defeated,
    ...stages(player,def),uniqueBlocked:uniqueBlock});
  }
 }
 const completed=new Set(player.completed??[]),
  queued=new Set(Object.values(player.researchQueues??{}).flat().map(j=>j.id));
 const catalog=researchCatalog(match,player)??knownResearch;
 const research=[];
 for(const [id,def] of catalog){
  const exclusiveConflict=!!def.exclusive&&[...catalog.values()].some(other=>
   other.id!==id&&other.exclusive===def.exclusive&&
   (completed.has(other.id)||queued.has(other.id)));
  const eligibleFacility=(def.locations??(id.startsWith("CIV-")?["Town Center"]:[]))
   .flatMap(base=>Object.keys(player.researchQueues??{}).filter(f=>f.split("#")[0]===base))
   .find(f=>(player.researchQueues[f]?.length??0)<6);
  const missing=(def.requires??[]).filter(dep=>!completed.has(dep));
  const done=completed.has(id),inQueue=queued.has(id);
  research.push({id,name:def.name,age:def.age,cost:costCopy(def),
   durationMs:def.ms,requires:[...(def.requires??[])],missing,completed:done,
   queued:inQueue,facility:eligibleFacility??null,
   ...stages(player,def),
   available:!done&&!inQueue&&!exclusiveConflict&&missing.length===0&&
    !!eligibleFacility&&legalAge(player,def.age)&&affordable(player.resources,def.cost??{})&&
    player.alive&&!player.defeated});
 }
 research.sort((a,b)=>AGE.indexOf(a.age)-AGE.indexOf(b.age)||a.id.localeCompare(b.id));
 return {playerId:player.id,faction:player.faction,age:player.age,
  revision:match.fullCatalog?.revision??"shared-prototype",
  buildings,training,research};
}
