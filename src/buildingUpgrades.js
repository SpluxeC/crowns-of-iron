import {assert,ageIndex,spend,refund} from "./util.js";
import {getPlayer} from "./state.js";
import {refreshStructureTechnology} from "./technologyEffects.js";

// Only effects with real simulation support are purchasable. All remaining 126
// definitions remain visible data but are not deceptively "completed" upgrades.
const supported=Object.freeze({
  "Training Equipment I":{kind:"trainingSpeed",factor:.90},
  "Reinforced Barracks":{kind:"buildingHp",factor:1.15},
  "Assembly Equipment":{kind:"trainingSpeed",factor:.95},
  "Extended Housing":{kind:"housing",amount:5},
  "Reinforced Command Hall":{kind:"buildingHp",factor:1.15},
  "Training Equipment":{kind:"trainingSpeed",factor:.90},
  "Heavy Assembly":{kind:"trainingSpeed",factor:.90},
  "Advanced Slipways":{kind:"trainingSpeed",factor:.90},
  "Reinforced Ramparts":{kind:"buildingHp",factor:1.15},
  "Automatic Feed":{kind:"trainingSpeed",factor:.90}
});
export function upgradeCoverage(match){
 const records=Object.values(match.fullCatalog?.upgrades??{}).flat();
 return {catalog:records.length,executable:records.filter(x=>supported[x.name]).length,
   pending:records.filter(x=>!supported[x.name]).length};
}
export function queueBuildingUpgrade(match,owner,siteId,name){
 const p=getPlayer(match,owner);
 const site=match.constructions?.[siteId];
 assert(site&&site.owner===owner&&site.completed,"Must own a completed building");
 assert(supported[name],"Building upgrade effect not implemented");
 const def=(match.fullCatalog?.upgrades?.[p.faction]??[]).find(u=>u.building===site.kind&&u.name===name);
 assert(def,"Upgrade not available for this building");
 assert(ageIndex(p.age)>=ageIndex(def.age),"Building upgrade age locked");
 const active=site.upgrades??[],pending=site.upgradeQueue??[];
 assert(!active.includes(name)&&!pending.some(q=>q.name===name),"Upgrade already owned or queued");
 assert(pending.length<3,"Building upgrade queue full");
 spend(p.resources,def.cost);
 site.upgradeQueue??=[];
 const job={name,elapsedMs:0,started:false,durationMs:def.ms,cost:structuredClone(def.cost)};
 site.upgradeQueue.push(job);
 return job;
}
export function cancelBuildingUpgrade(match,owner,siteId,name){
 const site=match.constructions?.[siteId];
 assert(site&&site.owner===owner,"No such owned building");
 const queue=site.upgradeQueue??[],idx=queue.findIndex(x=>x.name===name);
 assert(idx>=0,"Upgrade not queued");
 const [job]=queue.splice(idx,1);
 refund(getPlayer(match,owner).resources,job.cost,job.started?.75:1);
 return job;
}
function complete(match,site,name){
 const kind=supported[name];
 site.upgrades??=[];
 site.upgrades.push(name);
 if(kind.kind==="trainingSpeed"){
   site.localTrainingReduction=(site.localTrainingReduction??0)+(1-kind.factor);
   site.trainTimeFactor=1-Math.min(.25,site.localTrainingReduction);
 }
 if(kind.kind==="housing"){
   const p=getPlayer(match,site.owner);
   site.upgradeHousing=(site.upgradeHousing??0)+kind.amount;
   p.popCap=Math.min(300,p.popCap+kind.amount);
 }
 if(kind.kind==="buildingHp"){
   site.localHpFactor=(site.localHpFactor??1)*kind.factor;
   refreshStructureTechnology(match,getPlayer(match,site.owner));
 }
}
export function tickBuildingUpgrades(match,deltaMs){
 for(const id of Object.keys(match.constructions??{}).sort()){
   const site=match.constructions[id];
   if(!site.completed||!site.upgradeQueue?.length)continue;
   let remaining=deltaMs;
   while(remaining>0&&site.upgradeQueue.length){
     const job=site.upgradeQueue[0];
     job.started=true;
     const step=Math.min(remaining,job.durationMs-job.elapsedMs);
     job.elapsedMs+=step;remaining-=step;
     if(job.elapsedMs<job.durationMs)break;
     site.upgradeQueue.shift();complete(match,site,job.name);
   }
 }
}
export function refundDestroyedBuildingUpgrades(player,site){
 for(const job of site.upgradeQueue??[])refund(player.resources,job.cost,job.started?.5:1);
}
