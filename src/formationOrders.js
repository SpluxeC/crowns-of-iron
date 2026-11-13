import {assert} from "./util.js";
import {getPlayer} from "./state.js";
import {pathForUnit,movementDomain} from "./movementDomains.js";
import {ATTACK_PROFILE} from "./battlefield.js";
import {hasLineOfSight} from "./tacticalNavigation.js";
import {mayAttackStructure} from "./engagementRules.js";
import {planFormation} from "./groupNavigation.js";

/** Assign all formation slots before mutating any order. */
export function orderFormation(match,owner,ids,x,y){
 assert(match.battlefield,"Battlefield required");
 assert(Number.isInteger(x)&&Number.isInteger(y),"Invalid formation destination");
 assert(Array.isArray(ids)&&ids.length>0&&ids.length<=24&&new Set(ids).size===ids.length,
  "Formation size or duplicate unit IDs invalid");
 const p=getPlayer(match,owner);
 const units=ids.map(id=>p.units.find(u=>u.id===id&&u.alive&&
  !u.garrisonedAt&&!u.embarkedAt&&Number.isInteger(u.x)&&Number.isInteger(u.y)));
 assert(units.every(Boolean),"Only owned, positioned units may join formation");
 const plans=planFormation(match,owner,units,x,y);
 for(const plan of plans)match.orders[plan.unitId]={kind:"move",path:plan.path.slice(1),
  carryMs:0,destination:plan.destination,formation:true};
 return plans.map(({unitId,destination})=>({unitId,destination}));
}
const aim=(u,loc)=>({x:Math.min(loc.x+loc.width-1,Math.max(loc.x,u.x)),
 y:Math.min(loc.y+loc.height-1,Math.max(loc.y,u.y))});
export function orderSiege(match,owner,unitId,siteId){
 const p=getPlayer(match,owner),unit=p.units.find(u=>u.id===unitId&&u.alive);
 const site=match.constructions?.[siteId];
 const location=match.battlefield?.structures.find(s=>s.id===siteId);
 assert(unit&&Number.isInteger(unit.x)&&!unit.garrisonedAt,"Invalid siege unit");
 assert(site?.completed&&location,"Siege target missing");
 const target=match.players.find(p=>p.id===site.owner);
 assert(target&&target.team!==p.team,"Cannot siege allied structure");
 assert(mayAttackStructure(unit),"Siege unit must have an eligible weapon");
 const range=unit.range??ATTACK_PROFILE[unit.archetype]?.[0]??0;
 assert(range>0,"No siege attack range");
 const center=aim(unit,location);
 const route=pathForUnit(match,owner,unit.archetype,{x:unit.x,y:unit.y},center,
  {range,visible:pos=>range<=1||hasLineOfSight(match.battlefield,pos,center)});
 assert(route,"No reachable siege firing position");
 match.orders[unitId]={kind:"siege",siteId,carryMs:0,path:route.slice(1)};
 return {unitId,siteId,steps:route.length-1};
}
export function refreshSiegePath(match,unit,order){
 const loc=match.battlefield?.structures.find(s=>s.id===order.siteId);
 const site=match.constructions?.[order.siteId];
 if(!loc||!site?.completed){delete match.orders[unit.id];return;}
 const p=match.players.find(x=>x.id===unit.owner),point=aim(unit,loc);
 const range=unit.range??ATTACK_PROFILE[unit.archetype]?.[0]??0;
 const route=pathForUnit(match,p.id,unit.archetype,{x:unit.x,y:unit.y},point,
  {range,visible:pos=>range<=1||hasLineOfSight(match.battlefield,pos,point)});
 if(!route){delete match.orders[unit.id];return;}
 order.path=route.slice(1);
}
