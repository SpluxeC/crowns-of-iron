/** AI research treasury reservation: funds reserved for the next unqueued
 * mandatory age technology cannot be consumed by optional recruitment.
 * No resources are created or modified here. */
import {AGE_GATE} from "./constants.js";
import {researchCatalog} from "./fullCatalog.js";
export function nextAgeTechnology(match,player){
 const catalog=researchCatalog(match,player);
 for(const id of AGE_GATE[player.age]??[]){
  if(player.completed.includes(id))continue;
  if(Object.values(player.researchQueues).some(q=>q.some(job=>job.id===id)))continue;
  return catalog?.get(id)??null;
 }
 return null;
}
export function ageResearchDeficit(match,player){
 const tech=nextAgeTechnology(match,player);
 return tech?Object.fromEntries(Object.entries(tech.cost).map(([k,cost])=>[
  k,Math.max(0,cost-(player.resources[k]??0))
 ])):{};
}
export function canFundOptionalSpend(match,player,cost){
 if(!match.fullCatalog||!match.battlefield||match.economyMode!=="spatial")
  return true;
 const tech=nextAgeTechnology(match,player);
 if(!tech)return true;
 return Object.entries(cost).every(([resource,amount])=>
  (player.resources[resource]??0)-amount >= (tech.cost[resource]??0));
}
