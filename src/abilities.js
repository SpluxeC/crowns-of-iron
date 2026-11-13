import {assert} from "./util.js";
import {damage,applyStatus} from "./combat.js";
import {killUnit,getPlayer} from "./state.js";
const COOLDOWN_MS=45000;
export const HERO_ABILITIES=Object.freeze({
  Humans:{passive:"Inspiring Presence",active:"Rally the Crown",kind:"rally",radius:4,durationMs:12000},
  Orcs:{passive:"Bloodlust",active:"Warchief's Roar",kind:"roar",radius:4,durationMs:10000},
  Dwarfs:{passive:"Stoneheart",active:"Runic Bulwark",kind:"bulwark",radius:4,durationMs:15000},
  "Tree Elves":{passive:"Woodland Grace",active:"Rain of Thorns",kind:"thorns",radius:3},
  "Corrupt Elves":{passive:"Withering Aura",active:"Eclipse Curse",kind:"curse",radius:5},
  Ursa:{passive:"Thick Hide",active:"Earthshaker",kind:"earthshaker",radius:2}
});
const distance=(a,b)=>Math.abs(a.x-b.x)+Math.abs(a.y-b.y);
function livingUnit(match,playerId,unitId){
  const p=getPlayer(match,playerId);
  const unit=p.units.find(u=>u.id===unitId&&u.alive);
  assert(unit,"Hero ability unit not available");
  return [p,unit];
}
export function useHeroAbility(match,playerId,heroId,point){
  assert(match.battlefield,"Hero abilities require a battlefield");
  const [p,hero]=livingUnit(match,playerId,heroId);
  assert(hero.archetype==="Hero","Only the faction Hero may use this ability");
  assert(Number.isInteger(hero.x)&&Number.isInteger(hero.y),"Hero is not positioned");
  const descriptor=HERO_ABILITIES[p.faction];assert(descriptor,"Faction ability undefined");
  const now=match.elapsedMs;
  assert((hero.nextAbilityAtMs??0)<=now,"Hero ability on cooldown");
  const targetPoint=point??{x:hero.x,y:hero.y};
  assert(Number.isInteger(targetPoint.x)&&Number.isInteger(targetPoint.y),"Invalid ability position");
  assert(distance(hero,targetPoint)<=5,"Ability target out of range");
  let affected=0;
  if(["rally","roar","bulwark"].includes(descriptor.kind)){
    const allyUnits=match.players.filter(x=>x.team===p.team)
      .flatMap(x=>x.units.filter(u=>u.alive&&Number.isInteger(u.x)));
    for(const u of allyUnits){
      if(distance(u,hero)>descriptor.radius)continue;
      u.buffs??=[];
      u.buffs=u.buffs.filter(b=>b.kind!==descriptor.kind&&b.expiresMs>now);
      u.buffs.push({kind:descriptor.kind,expiresMs:now+descriptor.durationMs,
        attackMultiplier:descriptor.kind==="rally"?1.15:descriptor.kind==="roar"?1.2:1,
        armorBonus:descriptor.kind==="bulwark"?6:0});
      affected++;
    }
  }else if(descriptor.kind==="thorns"||descriptor.kind==="earthshaker"){
    for(const enemy of match.players.filter(x=>x.team!==p.team&&!x.defeated)){
      for(const unit of enemy.units.filter(u=>u.alive&&Number.isInteger(u.x))){
        if(distance(unit,targetPoint)>descriptor.radius)continue;
        // Hero abilities use the shared counter+armor rules, not arbitrary client damage.
        const value=damage(descriptor.kind==="thorns"?28:38,unit.armor,
          descriptor.kind==="thorns"?"Pierce":"Crush",unit.category);
        unit.hp=Math.max(0,unit.hp-value);
        if(unit.hp===0)killUnit(enemy,unit.id);
        affected++;
      }
    }
  }else{
    // Eclipse Curse: one explicitly chosen living enemy target, 40 direct
    // Corruption damage followed by a finite six-second status.
    const enemyCandidates=match.players.filter(x=>x.team!==p.team&&!x.defeated)
      .flatMap(x=>x.units.filter(u=>u.alive&&u.x===targetPoint.x&&u.y===targetPoint.y)
        .map(u=>({p:x,u}))).sort((a,b)=>a.u.id.localeCompare(b.u.id));
    assert(enemyCandidates.length>0,"No enemy unit at target");
    const {p:enemy,u}=enemyCandidates[0];
    const value=damage(40,u.armor,"Corruption",u.category);
    u.hp=Math.max(0,u.hp-value);
    if(u.hp===0)killUnit(enemy,u.id);
    else applyStatus(u,"Corruption",6000,2);
    affected=1;
  }
  assert(affected>0,"No eligible targets for ability");
  hero.nextAbilityAtMs=now+COOLDOWN_MS;
  return {name:descriptor.active,affected,nextAvailableMs:hero.nextAbilityAtMs};
}
export function getEffectiveStats(unit,nowMs){
  const buffs=(unit.buffs??[]).filter(b=>b.expiresMs>nowMs);
  const multiplier=buffs.reduce((v,b)=>v*(b.attackMultiplier??1),1);
  const armor=buffs.reduce((v,b)=>v+(b.armorBonus??0),unit.armor);
  return {attack:unit.attack*multiplier,armor};
}
export function passiveDescription(faction){
  return HERO_ABILITIES[faction]?.passive??null;
}
