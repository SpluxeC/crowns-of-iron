import {assert} from "./util.js";
import {pathForUnit,movementDomain} from "./movementDomains.js";
import {ATTACK_PROFILE} from "./battlefield.js";

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
 return target.category!=="Air"||ANTI_AIR.has(u.archetype);
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
/** One deterministic tactical decision; does not issue unvalidated client commands. */
export function planArmyOrders(match,owner,{stance="assault",maxOrders=12}={}){
 assert(STANCES.has(stance),"Invalid army stance");
 if(!match.battlefield||stance==="hold")return [];
 const p=match.players.find(x=>x.id===owner);
 assert(p&&!p.defeated,"Unknown active AI");
 const start=match.battlefield.starts[match.players.indexOf(p)];
 const attackers=p.units.filter(u=>u.alive&&Number.isInteger(u.x)&&
    u.attack>0&&u.archetype!=="Worker"&&!u.garrisonedAt)
   .sort((a,b)=>a.id.localeCompare(b.id));
 const enemies=match.players.filter(x=>x.team!==p.team&&!x.defeated).flatMap(owner=>
  owner.units.filter(u=>u.alive&&Number.isInteger(u.x)&&!u.garrisonedAt)
   .map(unit=>({owner,unit})));
 const issued=[];let focus=null;
 for(const unit of attackers){
   if(issued.length>=maxOrders)break;
   const current=match.orders?.[unit.id];
   if(current?.kind==="attack"&&current.aiIssued){
     const target=enemies.find(e=>e.owner.id===current.targetPlayer&&e.unit.id===current.targetId);
     if(target&&(stance!=="defend"||distance(target.unit,start)<=12))continue;
     delete match.orders[unit.id];
   }else if(current)continue;
   const candidates=enemies.filter(e=>eligible(unit,e.unit)&&
      (stance!=="defend"||distance(e.unit,start)<=12))
     .sort((a,b)=>score(a.unit,unit,stance,focus)-score(b.unit,unit,stance,focus)||
       a.unit.id.localeCompare(b.unit.id));
   const [fallbackRange]=ATTACK_PROFILE[unit.archetype]??[1];
   const range=unit.range??fallbackRange;
   if(range<=0)continue;
   for(const candidate of candidates.slice(0,8)){
     // Real reachability check avoids ordering melee armies into sealed targets.
     const path=pathForUnit(match,p.id,unit.archetype,{x:unit.x,y:unit.y},
      {x:candidate.unit.x,y:candidate.unit.y},{range});
     if(!path)continue;
     match.orders??={};
     match.orders[unit.id]={kind:"attack",targetPlayer:candidate.owner.id,
       targetId:candidate.unit.id,carryMs:0,aiIssued:true};
     focus??=candidate.unit.id;
     issued.push({unitId:unit.id,targetId:candidate.unit.id});
     break;
   }
 }
 return issued;
}
