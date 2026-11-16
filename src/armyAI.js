import {assert} from "./util.js";
import {pathForUnit,movementDomain} from "./movementDomains.js";
import {ATTACK_PROFILE} from "./battlefield.js";
import {canEngage} from "./engagementRules.js";
import {selectSquadObjective,threatenedLocations,gridDistance} from "./botTargeting.js";

const STANCES=new Set(["assault","defend","raid","hold"]);
const ANTI_AIR=new Set(["Anti-Air Infantry","Interceptor","Gunship","Aerial Battleship"]);
const distance=(a,b)=>Math.abs(a.x-b.x)+Math.abs(a.y-b.y);
export function setArmyStance(match,owner,stance){
 assert(STANCES.has(stance),"Invalid army stance");
 const bot=match.bots?.[owner];
 assert(bot,"Only an enabled AI player has an army stance");
 bot.stance=stance;
 if(stance==="hold"){
  const p=match.players.find(p=>p.id===owner);
  for(const u of p.units)if(match.orders?.[u.id]?.aiIssued)delete match.orders[u.id];
 }
 return stance;
}
function eligible(u,target){
 return canEngage(u,target);
}
function score(target,unit,stance,allyFocus){
 let s=distance(target,unit)*10;
 if(stance==="raid"&&target.archetype==="Worker")s-=80;
 if(stance==="defend"&&target.archetype!=="Worker")s-=15;
 if(target.archetype==="Heavy Artillery"||target.archetype==="Bomber")s-=18;
 s+=Math.min(50,target.hp/15);
 if(allyFocus===target.id)s-=25;
 return s;
}
/** Favor the current target unless the squad focus is materially more urgent.
 * Pure comparison: military navigation/engagement legality is still validated
 * by planArmyOrders before any new attack order is issued. */
export function shouldDefenderRetarget(unit,currentTarget,objective){
 if(!objective||objective.id===currentTarget?.id)return false;
 return score(objective,unit,"defend",objective.id)+25<
  score(currentTarget,unit,"defend",null);
}
/** A defensive order is only worth retaining against an armed enemy near
 * a protected location. Offensive stances retain their normal targets. */
export function shouldRetainBotAttackTarget(unit,target,stance,protectedPoints,base){
 if(!target||!eligible(unit,target))return false;
 if(stance!=="defend")return true;
 if(target.archetype==="Worker"||!(target.attack>0))return false;
 return protectedPoints
  ?protectedPoints.some(pt=>gridDistance(pt,target)<=9)
  :distance(target,base)<=12;
}
/** Probe ranked targets in order with a strict pathfinding budget.
 * The old eight-candidate cutoff could strand an army when its first eight
 * targets were unreachable even though the ninth had a legal route. */
export function selectReachableBotTarget(candidates,canReach,maxChecks=16){
 assert(Number.isSafeInteger(maxChecks)&&maxChecks>=1&&maxChecks<=32,
  "Invalid AI pathfinding budget");
 for(const candidate of candidates.slice(0,maxChecks))
  if(canReach(candidate))return candidate;
 return null;
}
/** One deterministic tactical decision; does not issue unvalidated client commands. */
export function planArmyOrders(match,owner,{stance="assault",maxOrders=12}={}){
 assert(STANCES.has(stance),"Invalid army stance");
 if(!match.battlefield||stance==="hold")return [];
 const p=match.players.find(x=>x.id===owner);
 assert(p&&!p.defeated,"Unknown active AI");
 const start=match.battlefield.starts[match.players.indexOf(p)];
 const attackers=p.units.filter(u=>u.alive&&Number.isInteger(u.x)&&
    u.attack>0&&u.archetype!=="Worker"&&!u.garrisonedAt&&!u.embarkedAt)
   .sort((a,b)=>a.id.localeCompare(b.id));
 const enemies=match.players.filter(x=>x.team!==p.team&&!x.defeated).flatMap(owner=>
  owner.units.filter(u=>u.alive&&Number.isInteger(u.x)&&!u.garrisonedAt&&!u.embarkedAt)
   .map(unit=>({owner,unit})));
 const objective=match.fullCatalog?selectSquadObjective(match,owner,stance,attackers):null;
 const points=stance==="defend"&&match.fullCatalog?threatenedLocations(match,owner):null;
 const issued=[];let focus=objective?.unit.id??null;
 for(const unit of attackers){
   if(issued.length>=maxOrders)break;
   const current=match.orders?.[unit.id];
   let previousTarget=null;
   if(current?.kind==="attack"&&current.aiIssued){
     previousTarget=enemies.find(e=>e.owner.id===current.targetPlayer&&e.unit.id===current.targetId);
     const retainable=shouldRetainBotAttackTarget(unit,previousTarget?.unit,
      stance,points,start);
     if(retainable&&
       !(stance==="defend"&&shouldDefenderRetarget(unit,previousTarget.unit,objective?.unit)))
      continue;
     // Keep a valid, in-zone fallback while checking candidate routes.
     // Out-of-zone/illegal orders are discarded if no replacement is reachable.
   }else if(current)continue;
   const candidates=enemies.filter(e=>eligible(unit,e.unit)&&
      (stance!=="defend"||(points?points.some(pt=>gridDistance(pt,e.unit)<=9):distance(e.unit,start)<=12)))
     .sort((a,b)=>(score(a.unit,unit,stance,focus)-
      (objective?.unit.id===a.unit.id?85:0))-
      (score(b.unit,unit,stance,focus)-
      (objective?.unit.id===b.unit.id?85:0))||
       a.owner.id.localeCompare(b.owner.id)||a.unit.id.localeCompare(b.unit.id));
   const [fallbackRange]=ATTACK_PROFILE[unit.archetype]??[1];
   const range=unit.range??fallbackRange;
   if(range<=0)continue;
   const candidate=selectReachableBotTarget(candidates,entry=>
    Boolean(pathForUnit(match,p.id,unit.archetype,{x:unit.x,y:unit.y},
     {x:entry.unit.x,y:entry.unit.y},{range})));
   if(candidate){
    match.orders??={};
    match.orders[unit.id]={kind:"attack",targetPlayer:candidate.owner.id,
      targetId:candidate.unit.id,carryMs:0,aiIssued:true};
    // Coordinate subsequent units around an objective that was actually
    // reachable; do not keep favoring a squad objective nobody can path to.
    focus=candidate.unit.id;
    issued.push({unitId:unit.id,targetId:candidate.unit.id});
   }
   // Cleanup an invalid stale order only when there is no valid target left.
   if(current?.aiIssued&&current.kind==="attack"&&!issued.some(x=>x.unitId===unit.id)&&
    !shouldRetainBotAttackTarget(unit,previousTarget?.unit,stance,points,start))
    delete match.orders[unit.id];
 }
 return issued;
}
