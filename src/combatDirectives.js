import {assert} from "./util.js";
import {getPlayer} from "./state.js";
import {pathForUnit,tileTraversable} from "./movementDomains.js";
import {canEngage} from "./engagementRules.js";

export const COMBAT_STANCES=Object.freeze(["hold","guard","aggressive"]);
export function setCombatStance(match,owner,unitId,stance){
 assert(COMBAT_STANCES.includes(stance),"Invalid combat stance");
 const unit=getPlayer(match,owner).units.find(u=>u.id===unitId&&u.alive);
 assert(unit,"Unit not owned or alive");
 assert(unit.attack>0,"Only armed units may use a combat stance");
 unit.combatStance=stance;
 if(match.orders?.[unitId]?.automatic)delete match.orders[unitId];
 return {unitId,stance};
}
export function issueAttackMove(match,owner,unitId,x,y){
 const unit=getPlayer(match,owner).units.find(u=>u.id===unitId&&u.alive);
 assert(unit&&unit.attack>0,"Attack-move requires an owned armed unit");
 assert(!unit.garrisonedAt&&!unit.embarkedAt&&Number.isInteger(unit.x),
  "Attack-move unit must be deployed and positioned");
 assert(Number.isInteger(x)&&Number.isInteger(y)&&
  tileTraversable(match,owner,unit.archetype,x,y),"Invalid attack-move destination");
 const path=pathForUnit(match,owner,unit.archetype,{x:unit.x,y:unit.y},{x,y});
 assert(path,"Attack-move destination is unreachable");
 match.orders[unitId]={kind:"attackMove",path:path.slice(1),destination:{x,y},
  carryMs:0,engaged:null,blockedSteps:0};
 return {unitId,destination:{x,y},distance:path.length-1};
}
/** Bounded visibility of this unit alone. Server, never client, chooses targets. */
export function selectAutomaticTarget(match,owner,unit,radius=4){
 const p=getPlayer(match,owner),targets=[];
 if(unit.attack<=0||!Number.isInteger(unit.x)||!Number.isInteger(unit.y))return null;
 for(const enemy of match.players){
  if(enemy.team===p.team||enemy.defeated)continue;
  for(const target of enemy.units){
   if(!target.alive||target.embarkedAt||target.garrisonedAt||
    !Number.isInteger(target.x)||!Number.isInteger(target.y)||!canEngage(unit,target))continue;
   const distance=Math.abs(target.x-unit.x)+Math.abs(target.y-unit.y);
   if(distance<=Math.min(4,radius))targets.push({targetPlayer:enemy.id,targetId:target.id,distance});
  }
 }
 targets.sort((a,b)=>a.distance-b.distance||
  a.targetId.localeCompare(b.targetId)||a.targetPlayer.localeCompare(b.targetPlayer));
 return targets[0]??null;
}
