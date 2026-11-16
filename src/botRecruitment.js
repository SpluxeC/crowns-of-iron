/** Age-appropriate AI recruitment from facilities the bot actually owns.
 * Uses real faction unit costs, age locks, population and queue capacity. */
import {affordable,ageIndex} from "./util.js";
import {unitDefinition} from "./fullCatalog.js";
import {PRODUCTION_LOCATIONS,queueUnit} from "./production.js";
const PLANS={
 I:["Club Fighter","Stone Spearman","Stone Slinger","Scout"],
 II:["Swordsman","Archer","Raider","Pikeman","Club Fighter"],
 III:["Heavy Infantry","Archer","Swordsman","Raider","Pikeman"],
 IV:["Gunner","Heavy Infantry","Anti-Air Infantry","Archer"],
 V:["Mechanized Infantry","Heavy Infantry","Gunner","Anti-Air Infantry"]
};
export function tryBotRecruitment(match,player,desiredArmy=12){
 if(!match.fullCatalog||player.defeated)return null;
 const troops=player.units.filter(u=>u.alive&&u.archetype!=="Worker").length;
 const queued=Object.values(player.unitQueues).flat();
 const waiting=queued.filter(j=>j.role!=="Worker").length;
 if(troops+waiting>=desiredArmy||player.popUsed+queued.reduce((a,j)=>a+j.definition.pop,0)>=player.popCap)
  return null;
 const age=PLANS[player.age]??PLANS.I;
 const count=Object.fromEntries(age.map(role=>[role,
  player.units.filter(u=>u.alive&&u.archetype===role).length+
  queued.filter(j=>j.role===role).length]));
 const candidates=[...age].sort((a,b)=>count[a]-count[b]||age.indexOf(a)-age.indexOf(b));
 for(const role of candidates){
  const def=unitDefinition(match,player,role);
  if(!def||ageIndex(player.age)<ageIndex(def.age)||!affordable(player.resources,def.cost))
   continue;
  for(const facility of Object.keys(player.unitQueues).sort()){
   if(!(PRODUCTION_LOCATIONS[role]??[]).includes(facility.split("#")[0])||
    player.unitQueues[facility].length>=8)continue;
   if(player.popUsed+queued.reduce((sum,j)=>sum+j.definition.pop,0)+def.pop>player.popCap)
    continue;
   try{queueUnit(player,facility,role,def);return {role,facility};}
   catch(error){
    if(/unique|full|age locked|population|resources|production/.test(error.message))continue;
    throw error;
   }
  }
 }
 return null;
}
