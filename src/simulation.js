import {createMatch,getPlayer,setWorkerAllocation,setPopCap,addFacility} from "./state.js";
import {gather,addIncome} from "./economy.js";
import {queueResearch,tickResearch,cancelResearch} from "./research.js";
import {queueUnit,tickProduction,cancelUnit} from "./production.js";
import {strike,heal,repair,tickStatuses} from "./combat.js";
import {assert,clone,hash} from "./util.js";
export {createMatch};
export function command(match,input){
  assert(match.winner===null,"Match already finished");
  const {player:id,action}=input;
  const player=getPlayer(match,id);
  assert(player.alive&&!player.defeated,"Player eliminated");
  let result;
  switch(action){
    case "allocate":result=setWorkerAllocation(player,input.workers);break;
    case "popCap":result=setPopCap(player,input.cap);break;
    case "facility":result=addFacility(player,input.name);break;
    case "income":result=addIncome(player,input.amount);break; // harness only, disallow on public network server
    case "research":result=queueResearch(player,input.facility,input.id);break;
    case "cancelResearch":result=cancelResearch(player,input.facility,input.id);break;
    case "train":result=queueUnit(player,input.facility,input.role);break;
    case "cancelTrain":result=cancelUnit(player,input.facility,input.index);break;
    case "attack":result=strike(player,getPlayer(match,input.targetPlayer),input.attacker,input.target,{canHitAir:input.canHitAir,specialist:input.specialist});break;
    case "heal":result=heal(player,input.healers,input.target);break;
    case "repair":result=repair(player,input.workers,input.target,input.amount);break;
    default:throw new Error("Unknown action: "+action);
  }
  match.commands.push(clone(input));return result;
}
export function checkElimination(match,deltaMs){
  for(const p of match.players){
    if(p.defeated)continue;
    const hasTc=(p.facilities["Town Center"]??0)>0;
    const hasWorker=p.units.some(u=>u.alive&&u.archetype==="Worker");
    const hasCombat=p.units.some(u=>u.alive&&u.archetype!=="Worker");
    if(hasTc||hasWorker){p.lastStandMs=null;continue;}
    if(!hasCombat){p.alive=false;p.defeated=true;p.lastStandMs=0;continue;}
    p.lastStandMs=(p.lastStandMs??300000)-deltaMs;
    if(p.lastStandMs<=0){p.alive=false;p.defeated=true;p.lastStandMs=0;}
  }
  const teams=new Set(match.players.filter(p=>!p.defeated).map(p=>p.team));
  if(teams.size===1)match.winner=[...teams][0];
}
export function step(match,deltaMs,opts={}){
  assert(Number.isSafeInteger(deltaMs)&&deltaMs>0&&deltaMs<=60000,"Tick must be 1–60000 ms");
  if(match.winner!==null)return match;
  for(const p of match.players.filter(x=>!x.defeated)){
    gather(p,deltaMs,opts.economy?.[p.id]??{});
    tickResearch(p,deltaMs);
    tickProduction(match,p,deltaMs);
    tickStatuses(p,deltaMs);
  }
  checkElimination(match,deltaMs);
  match.elapsedMs+=deltaMs;match.tick++;
  return match;
}
export function snapshot(match){return clone(match);}
export function checksum(match){return hash(snapshot(match));}
export function replay(participants,seed,events){
  const match=createMatch(participants,seed);
  for(const item of events){if(item.kind==="step")step(match,item.ms,item.options??{});else command(match,item);}
  return match;
}
