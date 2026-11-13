import {assert} from "./util.js";
import {getPlayer,killUnit} from "./state.js";
import {damage} from "./combat.js";
import {at} from "./map.js";
const BATTLEMENTS=new Set(["Stone Gatehouse","Fortress","Watchtower","Industrial Gate","Powered Gate"]);
const adjacent=(u,s)=>Math.max(s.x-u.x,0,u.x-s.x-s.width+1)+
 Math.max(s.y-u.y,0,u.y-s.y-s.height+1);
export function deploySiegeRamp(match,owner,towerId,siteId){
 const player=getPlayer(match,owner);
 const tower=player.units.find(u=>u.id===towerId&&u.alive&&u.archetype==="Siege Tower"&&
  Number.isInteger(u.x)&&!u.embarkedAt);
 const site=match.constructions?.[siteId];
 const loc=match.battlefield?.structures?.find(s=>s.id===siteId);
 const defender=match.players.find(p=>p.id===site?.owner);
 assert(tower,"Owned positioned Siege Tower required");
 assert(site?.completed&&loc&&defender?.team!==player.team&&BATTLEMENTS.has(site.kind),
   "Enemy battlement required");
 assert(adjacent(tower,loc)<=1,"Siege Tower must be at the wall");
 tower.rampSiteId=siteId;
 tower.rampReadyAtMs=match.elapsedMs+5000;
 delete match.orders?.[towerId];
 return {towerId,siteId,readyAtMs:tower.rampReadyAtMs};
}
export function assaultBattlement(match,owner,towerId,attackerId,targetId){
 const player=getPlayer(match,owner),tower=player.units.find(u=>u.id===towerId&&u.alive&&
  u.archetype==="Siege Tower");
 assert(tower&&tower.rampSiteId&&match.elapsedMs>=tower.rampReadyAtMs,
   "Siege ramp not deployed");
 const site=match.constructions?.[tower.rampSiteId];
 const loc=match.battlefield?.structures?.find(s=>s.id===tower.rampSiteId);
 const defenders=match.players.find(p=>p.id===site?.owner);
 assert(site?.completed&&loc&&BATTLEMENTS.has(site.kind)&&defenders?.team!==player.team&&
  adjacent(tower,loc)<=1,"Siege ramp has lost battlement access");
 const attacker=player.units.find(u=>u.id===attackerId&&u.alive&&u.embarkedAt===towerId);
 const target=defenders.units.find(u=>u.id===targetId&&u.alive&&u.garrisonedAt===tower.rampSiteId);
 assert(attacker&&target,"Only boarded infantry can assault battlement defenders");
 assert((attacker.nextAttackAtMs??0)<=match.elapsedMs,"Battlement attack on cooldown");
 const hit=damage(Math.max(1,attacker.attack),target.armor,attacker.type,target.category);
 target.hp=Math.max(0,target.hp-hit);
 attacker.nextAttackAtMs=match.elapsedMs+2000;
 if(target.hp===0){
  killUnit(defenders,targetId);
  site.garrisonIds=(site.garrisonIds??[]).filter(id=>id!==targetId);
 }
 return {attackerId,targetId,damage:hit,targetHp:target.hp};
}
export function resetInvalidRamps(match){
 for(const player of match.players)for(const tower of player.units.filter(u=>u.alive&&u.rampSiteId)){
  const site=match.constructions?.[tower.rampSiteId];
  const loc=match.battlefield?.structures.find(s=>s.id===tower.rampSiteId);
  if(!site?.completed||!loc||!Number.isInteger(tower.x)||adjacent(tower,loc)>1){
   tower.rampSiteId=null;tower.rampReadyAtMs=null;
  }
 }
}
