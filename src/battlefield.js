import {assert} from "./util.js";
import {at,findPath,walkable} from "./map.js";
import {strike} from "./combat.js";
import {getPlayer} from "./state.js";
import {hasLineOfSight} from "./tacticalNavigation.js";
import {pathForUnit,tileTraversable,movementDomain} from "./movementDomains.js";
import {canEngage} from "./engagementRules.js";
import {refreshSiegePath} from "./formationOrders.js";
import {occupiedCells,occupancyDomain as collisionDomain} from "./unitCollision.js";
import {selectAutomaticTarget} from "./combatDirectives.js";

export const ATTACK_PROFILE=Object.freeze({
  Worker:[1,2000],Scout:[1,1600],"Club Fighter":[1,1800],"Stone Slinger":[5,2200],
  "Stone Spearman":[1,2000],Swordsman:[1,1600],Archer:[7,2000],Pikeman:[1,1900],
  Raider:[1,1800],"Heavy Infantry":[1,2000],"Heavy Mobile":[1,2300],
  "Battering Ram":[1,4500],"Siege Tower":[0,0],Healer:[0,0],Converter:[0,0],
  Hero:[1,1800],Gunner:[8,2200],"Heavy Artillery":[11,5000],
  "Anti-Air Infantry":[8,2000],"Mechanized Infantry":[6,1700],
  "Heavy War Machine":[8,3500],"Legendary Land":[7,3000],
  "Light Warship":[8,2100],"Heavy Warship":[10,3200],
  "Naval Siege Ship":[13,5500],"Legendary Warship":[12,3600],
  Interceptor:[8,1600],Gunship:[8,2000],Bomber:[9,5000],
  "Aerial Battleship":[10,2800]
});
export function attachBattlefield(match,map){
  assert(!match.battlefield,"Battlefield already attached");
  assert(map?.starts?.length>=match.players.length,"Not enough map starts");
  match.battlefield=map;
  match.orders={};
  for(let i=0;i<match.players.length;i++){
    const start=map.starts[i],p=match.players[i];
    for(let j=0;j<p.units.length;j++) {
      p.units[j].x=start.x;
      p.units[j].y=start.y;
    }
  }
  return map;
}
function ownsUnit(match,pid,id){
  const p=getPlayer(match,pid);
  const u=p.units.find(x=>x.id===id&&x.alive);
  assert(u,"Unit not owned or alive");
  return u;
}
export function issueMove(match,pid,unitId,x,y){
  const map=match.battlefield;
  assert(map,"Battlefield is not attached");
  assert(Number.isInteger(x)&&Number.isInteger(y),"Invalid tile coordinates");
  const u=ownsUnit(match,pid,unitId);
  assert(tileTraversable(match,pid,u.archetype,x,y),"Destination not walkable or traversable");
  assert(!u.garrisonedAt&&!u.embarkedAt&&Number.isInteger(u.x)&&Number.isInteger(u.y),"Unit lacks a position or is garrisoned/embarked");
  const path=pathForUnit(match,pid,u.archetype,{x:u.x,y:u.y},{x,y});
  assert(path,"No route to destination");
  match.orders[unitId]={kind:"move",path:path.slice(1),carryMs:0,destination:{x,y}};
  return path.length-1;
}
export function issueAttack(match,pid,unitId,targetPlayer,targetId){
  const unit=ownsUnit(match,pid,unitId),enemy=ownsUnit(match,targetPlayer,targetId);
  const p=getPlayer(match,pid),other=getPlayer(match,targetPlayer);
  assert(p.team!==other.team,"Cannot attack an allied team");
  assert(unit.attack>0,"Unit has no direct weapon");
  assert(!unit.embarkedAt&&!enemy.embarkedAt,"Embarked units are not attackable");
  assert(canEngage(unit,enemy),"Target domain ineligible");
  assert(!unit.garrisonedAt&&!enemy.garrisonedAt&&Number.isInteger(unit.x)&&Number.isInteger(enemy.x),"Units lack positions or are garrisoned");
  match.orders[unitId]={kind:"attack",targetPlayer,targetId,carryMs:0};
}
function neighborsInRange(a,b,range){
  return Math.abs(a.x-b.x)+Math.abs(a.y-b.y)<=range;
}
const positionKey=(x,y)=>x+","+y;
/** Per-tick occupancy map updated on each step. Avoids scanning all live units
 * inside every movement collision query in an active large-army simulation. */
function occupiedByOther(occupancy,u,x,y){
 if(!occupancy)return false;
 const domain=collisionDomain(u);
 if(domain==="air")return false;
 return (occupancy[domain]?.get(positionKey(x,y))??[]).some(id=>id!==u.id);
}
function transferOccupancy(occupancy,u,oldX,oldY){
 if(!occupancy)return;
 const domain=collisionDomain(u);
 if(domain==="air")return;
 const cells=occupancy[domain];if(!cells)return;
 const oldKey=positionKey(oldX,oldY),newKey=positionKey(u.x,u.y);
 const prev=(cells.get(oldKey)??[]).filter(id=>id!==u.id);
 if(prev.length)cells.set(oldKey,prev);else cells.delete(oldKey);
 const next=cells.get(newKey)??[];next.push(u.id);cells.set(newKey,next);
}
function walkOne(match,owner,u,order,occupancy){
 if(!order.path?.length)return false;
 const next=order.path[0];
 if(!tileTraversable(match,owner,u.archetype,next.x,next.y)||
   occupiedByOther(occupancy,u,next.x,next.y))return false;
 const oldX=u.x,oldY=u.y;
 u.x=next.x;u.y=next.y;order.path.shift();
 transferOccupancy(occupancy,u,oldX,oldY);
 return true;
}
export function tickBattlefield(match,deltaMs){
  if(!match.battlefield)return [];
  const map=match.battlefield,events=[],
    occupancy=match.unitCollision?occupiedCells(match):null;
  for(let i=0;i<match.players.length;i++){
    const p=match.players[i],start=map.starts[i];
    for(const unit of p.units.filter(u=>u.alive&&!u.garrisonedAt&&!u.embarkedAt)){
      if(!Number.isInteger(unit.x)){
        if(movementDomain(unit.archetype)!=="land"||match.unitCollision)continue;
        unit.x=start.x;unit.y=start.y;
      }
      let order=match.orders?.[unit.id];
      if(!order&&["guard","aggressive"].includes(unit.combatStance)){
        const [defaultRange]=ATTACK_PROFILE[unit.archetype]??[1,2000];
        const radius=unit.combatStance==="guard"?(unit.range??defaultRange):4;
        const focus=selectAutomaticTarget(match,p.id,unit,radius);
        if(focus){
          match.orders[unit.id]={kind:"attack",targetPlayer:focus.targetPlayer,
           targetId:focus.targetId,carryMs:0,automatic:true,
           guard:unit.combatStance==="guard"};
          order=match.orders[unit.id];
        }
      }
      if(!order)continue;
      if(order.kind==="attackMove"){
        if(!order.engaged){
          order.engaged=selectAutomaticTarget(match,p.id,unit);
        }
        if(order.engaged){
          const opponent=match.players.find(x=>x.id===order.engaged.targetPlayer);
          const target=opponent?.units.find(x=>x.id===order.engaged.targetId&&x.alive);
          if(!target||!canEngage(unit,target)){
            order.engaged=null;
            const path=pathForUnit(match,p.id,unit.archetype,{x:unit.x,y:unit.y},
              order.destination);
            if(!path){
          if(order.kind==="attackMove"){order.engaged=null;continue;}
          delete match.orders[unit.id];continue;
        }
            order.path=path.slice(1);
          }
        }
      }
      if(order.kind==="siege"){
        refreshSiegePath(match,unit,order);
        if(!match.orders?.[unit.id])continue;
      }
      if(order.kind==="attack"||(order.kind==="attackMove"&&order.engaged)){
        const targetPlayer=order.engaged?.targetPlayer??order.targetPlayer,
          targetId=order.engaged?.targetId??order.targetId;
        const enemy=match.players.find(x=>x.id===targetPlayer);
        const target=enemy?.units.find(x=>x.id===targetId&&x.alive);
        if(!target||target.embarkedAt||!canEngage(unit,target)){
          if(order.kind==="attackMove"){order.engaged=null;continue;}
          delete match.orders[unit.id];continue;
        }
        const [fallbackRange,fallbackInterval]=ATTACK_PROFILE[unit.archetype]??[1,2000];
        const range=unit.range??fallbackRange,interval=unit.intervalMs||fallbackInterval;
        if(!range){delete match.orders[unit.id];continue;}
        if(order.guard&&!neighborsInRange(unit,target,range)){
          delete match.orders[unit.id];continue;
        }
        if(neighborsInRange(unit,target,range)&&
          (range<=1||movementDomain(unit.archetype)==="air"||hasLineOfSight(map,unit,target))){
          if((unit.nextAttackAtMs??0)<=match.elapsedMs){
            try{
              const amount=strike(p,enemy,unit.id,target.id,{nowMs:match.elapsedMs});
              unit.nextAttackAtMs=match.elapsedMs+interval;
              events.push({attacker:unit.id,target:target.id,amount});
            }catch(e){
              if(/ineligible|cooldown/.test(e.message)){delete match.orders[unit.id];continue;}
              throw e;
            }
          }
          continue;
        }
        // Melee/ranged units approach the target until their weapon can fire.
        const path=pathForUnit(match,p.id,unit.archetype,{x:unit.x,y:unit.y},{x:target.x,y:target.y},
          {range,visible:position=>range<=1||movementDomain(unit.archetype)==="air"||
            hasLineOfSight(map,position,target)});
        if(!path){delete match.orders[unit.id];continue;}
        order.path=path.slice(1);
      }
      const speedMs=unit.speed>0?Math.max(1,Math.round(1000/unit.speed)):
        Math.round((unit.archetype==="Scout"?400:650)/(unit.speedScale??1));
      order.carryMs=Math.min(2000,(order.carryMs??0)+deltaMs);
      // Bounded movement: up to 3 tiles per simulation step.
      for(let n=0;n<3&&order.carryMs>=speedMs&&order.path?.length;n++){
        if(!walkOne(match,p.id,unit,order,occupancy)){
          // 4.7: deterministic, bounded reroute around moving congestion.
          // An occupied final destination is left pending until it becomes free.
          if(match.unitCollision&&(order.kind==="move"||order.kind==="attackMove")&&
             order.destination&&!order.engaged){
            order.blockedSteps=(order.blockedSteps??0)+1;
            if(order.blockedSteps%2===1){
              const route=pathForUnit(match,p.id,unit.archetype,
                {x:unit.x,y:unit.y},order.destination,
                {blocked:(x,y)=>occupiedByOther(occupancy,unit,x,y)});
              if(route?.length>1)order.path=route.slice(1);
            }
          }
          break;
        }
        order.blockedSteps=0;
        order.carryMs-=speedMs;
      }
      if((order.kind==="move"||order.kind==="attackMove")&&
         !order.engaged&&!order.path.length)delete match.orders[unit.id];
    }
  }
  return events;
}
export function botTactics(match,playerId){
  if(!match.battlefield)return false;
  const p=getPlayer(match,playerId);
  const enemies=match.players.filter(x=>x.team!==p.team&&!x.defeated);
  const targets=enemies.flatMap(x=>x.units.filter(u=>u.alive&&u.hp>0&&Number.isInteger(u.x))
    .map(u=>({player:x,unit:u})));
  if(!targets.length)return false;
  let issued=false;
  for(const u of p.units.filter(x=>x.alive&&x.attack>0&&Number.isInteger(x.x)&&
    !(match.economyMode==="spatial"&&x.archetype==="Worker"))){
    if(match.orders?.[u.id]?.kind==="attack")continue;
    const candidates=targets.filter(t=>canEngage(u,t.unit));
    candidates.sort((a,b)=>{
      const da=Math.abs(u.x-a.unit.x)+Math.abs(u.y-a.unit.y);
      const db=Math.abs(u.x-b.unit.x)+Math.abs(u.y-b.unit.y);
      return da-db||a.unit.id.localeCompare(b.unit.id);
    });
    if(candidates.length){
      const target=candidates[0];
      try{issueAttack(match,playerId,u.id,target.player.id,target.unit.id);issued=true;}catch{}
    }
  }
  return issued;
}
