import {assert} from "./util.js";
import {getPlayer} from "./state.js";
import {pathForUnit,movementDomain} from "./movementDomains.js";
import {issueMove} from "./battlefield.js";
import {ATTACK_PROFILE} from "./battlefield.js";
import {hasLineOfSight} from "./tacticalNavigation.js";
import {mayAttackStructure} from "./engagementRules.js";

const OFFSETS=[[0,0],[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,-1],[1,-1],[-1,1],
 [2,0],[-2,0],[0,2],[0,-2],[2,1],[-2,-1],[2,-1],[-2,1],
 [1,2],[-1,-2],[1,-2],[-1,2],[2,2],[-2,-2],[2,-2],[-2,2]];
/** Atomic bounded group move: routes validated for all units before issuing orders. */
export function orderFormation(match,owner,ids,x,y){
 assert(match.battlefield,"Battlefield required");
 assert(Number.isInteger(x)&&Number.isInteger(y),"Invalid formation destination");
 assert(Array.isArray(ids)&&ids.length>0&&ids.length<=24&&new Set(ids).size===ids.length,
  "Formation size or duplicate unit IDs invalid");
 const p=getPlayer(match,owner);
 const units=ids.map(id=>p.units.find(u=>u.id===id&&u.alive&&
   !u.garrisonedAt&&Number.isInteger(u.x)&&Number.isInteger(u.y)));
 assert(units.every(Boolean),"Only owned, positioned units may join formation");
 const reserved=new Set(),plans=[];
 for(const unit of units){
  let chosen=null;
  for(const [dx,dy] of OFFSETS){
   const goal={x:x+dx,y:y+dy},key=goal.x+","+goal.y;
   if(reserved.has(key))continue;
   const path=pathForUnit(match,owner,unit.archetype,
     {x:unit.x,y:unit.y},goal);
   if(path&&path.at(-1).x===goal.x&&path.at(-1).y===goal.y){
    chosen={goal,path};reserved.add(key);break;
   }
  }
  assert(chosen,"Formation lacks reachable positions");
  plans.push({unitId:unit.id,...chosen});
 }
 for(const plan of plans)issueMove(match,owner,plan.unitId,plan.goal.x,plan.goal.y);
 return plans.map(p=>({unitId:p.unitId,destination:p.goal}));
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
