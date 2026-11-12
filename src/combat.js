import {CATEGORY,COUNTERS} from "./constants.js";
import {assert,spend} from "./util.js";
import {killUnit} from "./state.js";
export function damage(attack,armor,type="Slash",targetCategory="Standard",specialist=0){
  assert(Number.isFinite(attack)&&attack>=0&&Number.isFinite(armor),"Invalid combat stats");
  const table=COUNTERS[type];assert(table,"Unknown damage type");
  const index=CATEGORY.indexOf(targetCategory);assert(index>=0||targetCategory==="Air","Unknown target category");
  if(attack===0)return 0;
  const multiplier=Math.max(index<0?1:table[index],specialist||0);
  return Math.max(1,Math.floor(attack*multiplier*100/(100+Math.max(0,armor))));
}
export function strike(owner,targetOwner,attackerId,targetId,{nowMs=0}={}){
  const attacker=owner.units.find(u=>u.id===attackerId&&u.alive);
  const target=targetOwner.units.find(u=>u.id===targetId&&u.alive);
  assert(attacker&&target,"Missing living attacker or target");
  assert(owner.id!==targetOwner.id,"Cannot attack own unit");
  const antiAir=["Anti-Air Infantry","Interceptor","Gunship","Aerial Battleship"];
  if(target.category==="Air")assert(antiAir.includes(attacker.archetype),"Air target ineligible");
  assert((attacker.nextAttackAtMs??0)<=nowMs,"Attack on cooldown");
  const specialist=target.category==="Air"&&["Anti-Air Infantry","Interceptor"].includes(attacker.archetype)?1.5:0;
  const hit=damage(attacker.attack,target.armor,attacker.type,target.category,specialist);
  attacker.nextAttackAtMs=nowMs+2000;
  target.hp=Math.max(0,target.hp-hit);
  if(target.hp===0)killUnit(targetOwner,target.id);
  return hit;
}
export function heal(player,healerIds,targetId){
  const target=player.units.find(u=>u.id===targetId&&u.alive);
  assert(target,"Target must be alive");
  assert(!["Mechanical","Structure"].includes(target.category),"Mechanical units require repairs");
  assert(Array.isArray(healerIds)&&healerIds.length>=1,"Requires active healers");
  assert(new Set(healerIds).size===healerIds.length,"Duplicate healer");
  for(const id of healerIds)assert(player.units.some(u=>u.id===id&&u.alive&&u.archetype==="Healer"),"Invalid healer");
  // Each individual action restores 12 base HP, diminishing after the second.
  const amount=healerIds.reduce((n,_,i)=>n+12*(i<2?1:i===2?.75:.5),0);
  const healed=Math.min(target.maxHp-target.hp,Math.floor(amount));
  target.hp+=healed;return healed;
}
export function repair(player,workerIds,targetId,amount){
  const target=player.units.find(u=>u.id===targetId&&u.alive);
  assert(target&&target.category==="Mechanical","Repairs require living machinery");
  assert(Array.isArray(workerIds)&&workerIds.length>0,"Needs repairers");
  assert(new Set(workerIds).size===workerIds.length,"Duplicate worker");
  for(const id of workerIds)assert(player.units.some(u=>u.id===id&&u.alive&&u.archetype==="Worker"),"Invalid worker");
  assert(Number.isSafeInteger(amount)&&amount>0,"Invalid repair amount");
  const restored=Math.min(amount,target.maxHp-target.hp);
  const cost={};
  for(const k of ["Wood","Stone","Metal"]){
    const source=target.cost[k]??0;
    if(source)cost[k]=Math.ceil(.5*source*restored/target.maxHp);
  }
  if(restored>0)spend(player.resources,cost);
  target.hp+=restored;return {restored,cost};
}
export function applyStatus(unit,name,durationMs,dps){
  assert(unit.alive&&["Burning","Corruption"].includes(name),"Unsupported status");
  assert(Number.isSafeInteger(durationMs)&&durationMs>0&&Number.isFinite(dps)&&dps>=0,"Invalid effect");
  const existing=unit.status.find(s=>s.name===name);
  if(existing){existing.remainingMs=durationMs;existing.dps=Math.max(existing.dps,dps);}
  else unit.status.push({name,remainingMs:durationMs,dps,remainder:0});
}
export function tickStatuses(player,deltaMs){
  assert(Number.isSafeInteger(deltaMs)&&deltaMs>=0,"Invalid tick");
  for(const unit of player.units.filter(u=>u.alive)){
    for(const s of unit.status){
      const activeMs=Math.min(deltaMs,s.remainingMs);
      const sum=s.remainder+s.dps*activeMs/1000;
      const hit=Math.floor(sum+1e-10);
      s.remainder=sum-hit;s.remainingMs-=activeMs;
      unit.hp=Math.max(0,unit.hp-hit);
      if(!unit.hp){killUnit(player,unit.id);break;}
    }
    unit.status=unit.status.filter(s=>s.remainingMs>0);
  }
}
