import {mandatory,AGE_GATE} from "./constants.js";
import {assert,ageIndex,spend,refund} from "./util.js";
import {applyTechnologyCompletion} from "./technologyEffects.js";
export const knownResearch=new Map(mandatory.map(x=>[x.id,x]));
export function researchDefinition(id,catalog=knownResearch){
  const def=catalog.get(id);assert(def,"Unknown technology "+id);return def;
}
export function queueResearch(player,facility,id,catalog=knownResearch){
  assert(!player.defeated&&player.alive,"Player eliminated");
  assert(player.researchQueues[facility],"Invalid research facility");
  const def=researchDefinition(id,catalog);
  assert(ageIndex(player.age)>=ageIndex(def.age),"Research not unlocked by age");
  assert(!player.completed.includes(id),"Already researched");
  if(def.exclusive){
    for(const other of catalog.values()){
      if(other.id===id||other.exclusive!==def.exclusive)continue;
      assert(!player.completed.includes(other.id),"Conflicting exclusive research completed");
      for(const queue of Object.values(player.researchQueues))
        assert(!queue.some(j=>j.id===other.id),"Conflicting exclusive research queued");
    }
  }
  for(const jobs of Object.values(player.researchQueues))assert(!jobs.some(j=>j.id===id),"Already queued");
  const eligible=def.locations??(def.id.startsWith("CIV-")?["Town Center"]:[]);
  const baseName=facility.split("#")[0];
  assert(eligible.includes(baseName),"Facility cannot research this technology");
  assert(player.researchQueues[facility].length<6,"Research queue full");
  spend(player.resources,def.cost);
  const job={id,ms:0,started:false,cost:structuredClone(def.cost),duration:def.ms};
  player.researchQueues[facility].push(job);
  return job;
}
export function advanceAge(player){
  const required=AGE_GATE[player.age];
  if(required&&required.every(id=>player.completed.includes(id))){
    player.age=["I","II","III","IV","V"][ageIndex(player.age)+1];
    player.history.push("Age "+player.age);
    return true;
  }
  return false;
}
export function tickResearch(player,deltaMs,catalog=knownResearch){
  assert(Number.isSafeInteger(deltaMs)&&deltaMs>=0,"Invalid research delta");
  for(const jobs of Object.values(player.researchQueues)){
    let remaining=deltaMs;
    while(jobs.length&&remaining>0){
      const job=jobs[0],def=researchDefinition(job.id,catalog);
      if(ageIndex(player.age)<ageIndex(def.age))break;
      if((def.requires??[]).some(id=>!player.completed.includes(id)))break;
      job.started=true;
      const step=Math.min(remaining,job.duration-job.ms);
      job.ms+=step;remaining-=step;
      if(job.ms<job.duration)break;
      jobs.shift();player.completed.push(job.id);player.history.push("Research "+job.id);
      applyTechnologyCompletion(player,job.id);
      advanceAge(player);
    }
  }
}
export function cancelResearch(player,facility,id){
  const jobs=player.researchQueues[facility];assert(jobs,"Invalid facility");
  const i=jobs.findIndex(j=>j.id===id);assert(i>=0,"Research not queued");
  const [job]=jobs.splice(i,1);
  refund(player.resources,job.cost,job.started?.75:1);
  return job;
}
export function destroyResearchFacility(player,facility){
  const jobs=player.researchQueues[facility];assert(jobs,"Invalid research facility");
  for(const job of jobs)refund(player.resources,job.cost,job.started?0:1);
  delete player.researchQueues[facility];
}
