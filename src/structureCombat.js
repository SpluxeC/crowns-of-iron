import {assert,spend} from "./util.js";
import {getPlayer} from "./state.js";
import {ATTACK_PROFILE} from "./battlefield.js";
import {damage} from "./combat.js";
import {destroyToRuin} from "./ruins.js";
import {hasLineOfSight} from "./tacticalNavigation.js";
import {researchMultiplier} from "./technologyEffects.js";

const timber=new Set(["Shelter","Resource Depot","Training Camp","Farm","Archery Range"]);
function distToSite(unit,placement){
  const dx=Math.max(placement.x-unit.x,0,unit.x-(placement.x+placement.width-1));
  const dy=Math.max(placement.y-unit.y,0,unit.y-(placement.y+placement.height-1));
  return dx+dy;
}
function structureAim(unit,placement){
 return {x:Math.max(placement.x,Math.min(unit.x,placement.x+placement.width-1)),
   y:Math.max(placement.y,Math.min(unit.y,placement.y+placement.height-1))};
}
function targetSite(match,siteId){
  const site=match.constructions?.[siteId];
  const location=match.battlefield?.structures?.find(s=>s.id===siteId);
  assert(site&&site.completed&&location,"Completed target structure missing");
  return {site,location};
}
function liveUnit(match,owner,unitId){
  const player=getPlayer(match,owner),unit=player.units.find(x=>x.id===unitId&&x.alive);
  assert(unit&&Number.isInteger(unit.x)&&Number.isInteger(unit.y),"Missing positioned owned unit");
  return {player,unit};
}
export function orderStructureAttack(match,owner,unitId,siteId){
  assert(match.battlefield,"Battlefield is required");
  const {player,unit}=liveUnit(match,owner,unitId);
  const {site,location}=targetSite(match,siteId);
  const targetOwner=getPlayer(match,site.owner);
  assert(targetOwner.team!==player.team,"Cannot attack friendly buildings");
  const range=unit.range??(ATTACK_PROFILE[unit.archetype]?.[0]??0);
  assert(unit.attack>0&&range>0,"Unit has no siege-capable direct attack");
  assert(distToSite(unit,location)<=range,"Target structure out of weapon range");
  assert(range<=1||hasLineOfSight(match.battlefield,unit,structureAim(unit,location)),
    "Structure blocked by line of sight");
  match.orders[unitId]={kind:"structure",siteId};
  return true;
}
export function tickStructureCombat(match){
  if(!match.battlefield)return [];
  const events=[];
  for(const player of match.players){
    for(const unit of player.units.filter(x=>x.alive)){
      const order=match.orders?.[unit.id];
      if(order?.kind!=="structure")continue;
      const site=match.constructions?.[order.siteId];
      const loc=match.battlefield.structures.find(s=>s.id===order.siteId);
      if(!site?.completed||!loc){delete match.orders[unit.id];continue;}
      if(getPlayer(match,site.owner).team===player.team){delete match.orders[unit.id];continue;}
      const range=unit.range??(ATTACK_PROFILE[unit.archetype]?.[0]??0);
      if(distToSite(unit,loc)>range||
        (range>1&&!hasLineOfSight(match.battlefield,unit,structureAim(unit,loc)))){
        delete match.orders[unit.id];continue;}
      if((unit.nextAttackAtMs??0)>match.elapsedMs)continue;
      const buff=(unit.buffs??[]).filter(b=>b.expiresMs>match.elapsedMs);
      const attack=buff.reduce((sum,b)=>sum*(b.attackMultiplier??1),unit.attack)*
        researchMultiplier(player,"structureAttack",{unit});
      const category=timber.has(site.kind)?"Timber":"Masonry";
      const hit=damage(attack,site.armor,unit.type,category);
      site.hp=Math.max(0,site.hp-hit);
      unit.nextAttackAtMs=match.elapsedMs+(unit.intervalMs||ATTACK_PROFILE[unit.archetype]?.[1]||2000);
      events.push({unit:unit.id,siteId:order.siteId,damage:hit,remainingHp:site.hp});
      if(site.hp===0){destroyToRuin(match,order.siteId);delete match.orders[unit.id];}
    }
  }
  return events;
}
export function repairBuilding(match,owner,siteId,workerIds,requestedAmount){
  const {site,location}=targetSite(match,siteId);
  assert(site.owner===owner,"Not your building");
  assert(Array.isArray(workerIds)&&workerIds.length>0&&workerIds.length<=4&&
    new Set(workerIds).size===workerIds.length,"Invalid worker repair team");
  assert(Number.isSafeInteger(requestedAmount)&&requestedAmount>0,"Invalid repair amount");
  const p=getPlayer(match,owner),workers=workerIds.map(id=>p.units.find(u=>u.id===id&&u.alive&&u.archetype==="Worker"));
  assert(workers.every(Boolean),"Only owned living workers can repair");
  for(const w of workers){
    assert(Number.isInteger(w.x)&&distToSite(w,location)<=1,"Repair worker too far away");
    assert((w.nextRepairAtMs??0)<=match.elapsedMs,"Repair action on cooldown");
  }
  const missing=(site.maxHp??site.hp)-site.hp;
  const restored=Math.min(missing,requestedAmount,Math.floor(40*workers.length*researchMultiplier(p,"repair")));
  if(restored===0)return {restored:0,cost:{}};
  const cost=Object.fromEntries(["Wood","Stone","Metal"].map(k=>
    [k,Math.ceil(.6*(site.cost[k]??0)*restored/(site.maxHp??site.hp))]));
  spend(p.resources,cost);
  site.hp+=restored;
  for(const w of workers)w.nextRepairAtMs=match.elapsedMs+2000;
  return {restored,cost};
}
