import {assert,affordable,ageIndex} from "./util.js";
import {AGE_GATE,RESOURCES} from "./constants.js";
import {ARCHETYPES} from "./catalog.js";
import {setWorkerAllocation} from "./state.js";
import {queueResearch} from "./research.js";
import {queueUnit} from "./production.js";
import {planArmyOrders} from "./armyAI.js";
import {startConstruction} from "./construction.js";
import {canPlace} from "./map.js";
import {unitDefinition,researchCatalog} from "./fullCatalog.js";
import {assignSpatialBotWorker} from "./spatialBot.js";

const BOT_LEVELS=Object.freeze({
  Easy:{decisionMs:10000,workerGoal:8},
  Normal:{decisionMs:5000,workerGoal:14},
  Hard:{decisionMs:2000,workerGoal:20}
});
export function enableBot(match,id,difficulty="Normal"){
  assert(BOT_LEVELS[difficulty],"Invalid AI difficulty");
  const player=match.players.find(p=>p.id===id);
  assert(player&&!player.defeated,"Unknown or eliminated bot");
  match.bots??={};
  assert(!match.bots[id],"Player already uses AI");
  match.bots[id]={difficulty,accumulator:0,decisions:0};
  return match.bots[id];
}
export function disableBot(match,id){if(match.bots)delete match.bots[id];}
function assignWorkers(player){
  const count=player.units.filter(x=>x.alive&&x.archetype==="Worker").length;
  const result=Object.fromEntries(RESOURCES.map(k=>[k,0]));
  if(count===0)return;
  // Consistent priorities, with Age I metal unavailable and late-game Aether optional.
  const priority=player.age==="I"
    ?["Food","Wood","Food","Wood","Stone","Food","Gold"]
    :player.age==="II"
    ?["Food","Metal","Wood","Stone","Food","Gold","Metal","Wood"]
    :["Food","Metal","Wood","Stone","Gold","Food","Metal","Gold","Stone"];
  for(let i=0;i<count;i++)result[priority[i%priority.length]]++;
  setWorkerAllocation(player,result);
}
function tryResearch(player,match){
  const required=AGE_GATE[player.age]??[];
  for(const id of required){
    if(player.completed.includes(id))continue;
    const def=player.researchQueues["Town Center"]?.find(x=>x.id===id);
    if(def)continue;
    const all=Object.values(player.researchQueues).flat();
    if(all.some(x=>x.id===id))continue;
    try{
      // Queuing is allowed before prerequisites complete; the research channel waits.
      // Preserve queue capacity for other discoveries if this building is full.
      queueResearch(player,"Town Center",id,researchCatalog(match,player));
      return "research "+id;
    }catch(e){if(/Insufficient resources|Research queue full|Research not unlocked/.test(e.message))return null;throw e;}
  }
  return null;
}
function tryBaseExpansion(match,player) {
  const map=match.battlefield;
  if(!map||player.age!=="I"||player.facilities["Training Camp"])return null;
  if(Object.values(match.constructions??{}).some(j=>j.owner===player.id&&j.kind==="Training Camp"))return null;
  const worker=player.units.find(u=>u.alive&&u.archetype==="Worker"&&Number.isInteger(u.x)&&
    !match.harvestJobs?.[u.id]);
  if(!worker||player.resources.Wood<100||player.resources.Stone<40)return null;
  const start=map.starts[match.players.indexOf(player)];
  for(let radius=3;radius<=8;radius++)for(let dy=-radius;dy<=radius;dy++)for(let dx=-radius;dx<=radius;dx++){
    const x=start.x+dx,y=start.y+dy;
    if(Math.max(Math.abs(dx),Math.abs(dy))!==radius||!canPlace(map,x,y,3,3))continue;
    try {startConstruction(match,player.id,"Training Camp",x,y,[worker.id]);return "build Training Camp";}
    catch(e){if(/reach|placement/.test(e.message))continue;throw e;}
  }
  return null;
}
function tryInfantry(player,match){
  if(player.age!=="I"||!player.facilities["Training Camp"])return null;
  const trained=player.units.filter(u=>u.alive&&u.archetype==="Club Fighter").length;
  const queued=Object.values(player.unitQueues).flat().filter(j=>j.role==="Club Fighter").length;
  if(trained+queued>=4)return null;
  const k=Object.keys(player.unitQueues).find(x=>x.startsWith("Training Camp#"));
  if(!k||!affordable(player.resources,ARCHETYPES["Club Fighter"].cost))return null;
  if(player.popUsed+queued>=player.popCap)return null;
  queueUnit(player,k,"Club Fighter",unitDefinition(match,player,"Club Fighter"));return "train Club Fighter";
}
function tryWorker(player,goal,match){
  const trained=player.units.filter(u=>u.alive&&u.archetype==="Worker").length;
  const queued=Object.values(player.unitQueues).flat().filter(j=>j.role==="Worker").length;
  if(trained+queued>=goal)return null;
  const jobs=player.unitQueues["Town Center"]??[];
  if(jobs.length>=3||!affordable(player.resources,ARCHETYPES.Worker.cost))return null;
  if(player.popUsed+queued>=player.popCap)return null;
  queueUnit(player,"Town Center","Worker",unitDefinition(match,player,"Worker"));return "worker";
}
export function tickBots(match,deltaMs){
  assert(Number.isSafeInteger(deltaMs)&&deltaMs>=0,"Invalid AI tick");
  const events=[];
  for(const [id,bot] of Object.entries(match.bots??{}).sort(([a],[b])=>a.localeCompare(b))){
    const player=match.players.find(p=>p.id===id);
    if(!player||player.defeated||!player.alive)continue;
    const settings=BOT_LEVELS[bot.difficulty];
    bot.accumulator+=deltaMs;
    // One decision per tick, irrespective of accelerated time, prevents burst orders.
    if(bot.accumulator<settings.decisionMs)continue;
    bot.accumulator%=settings.decisionMs;
    if(match.economyMode!=="spatial")assignWorkers(player);
    // AI is economy/tech only. Tactical pathing and full-combat behaviors are later milestones.
    const harvest=match.economyMode==="spatial"?assignSpatialBotWorker(match,id):null;
    const decision=tryResearch(player,match)??tryWorker(player,settings.workerGoal,match)??
      tryBaseExpansion(match,player)??tryInfantry(player,match)??(harvest?"harvest "+harvest.resource:null);
    if(match.battlefield)planArmyOrders(match,id,{stance:bot.stance??"assault",maxOrders:bot.difficulty==="Hard"?12:bot.difficulty==="Normal"?6:3});
    bot.decisions++;
    if(decision)events.push({id,decision,atMs:match.elapsedMs});
  }
  return events;
}
export function botSummary(match){
  return Object.fromEntries(Object.entries(match.bots??{}).map(([id,b])=>[id,{difficulty:b.difficulty,decisions:b.decisions}]));
}
