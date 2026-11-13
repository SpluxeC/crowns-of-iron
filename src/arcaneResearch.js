import {assert} from "./util.js";
import {getPlayer,killUnit} from "./state.js";
import {at} from "./map.js";
import {researchMultiplier} from "./technologyEffects.js";
const dist=(a,b)=>Math.abs(a.x-b.x)+Math.abs(a.y-b.y);
const convertible=new Set(["Club Fighter","Stone Spearman","Stone Slinger","Swordsman","Archer",
 "Pikeman","Raider","Heavy Infantry","Gunner","Anti-Air Infantry","Mechanized Infantry"]);
export function startConversion(match,owner,converterId,targetPlayer,targetId){
 const player=getPlayer(match,owner),enemy=getPlayer(match,targetPlayer);
 assert(enemy.team!==player.team,"Cannot convert allies");
 const converter=player.units.find(u=>u.id===converterId&&u.alive&&u.archetype==="Converter"&&
   Number.isInteger(u.x)&&!u.garrisonedAt&&!u.embarkedAt);
 const target=enemy.units.find(u=>u.id===targetId&&u.alive&&!u.embarkedAt&&!u.garrisonedAt);
 assert(converter&&target&&convertible.has(target.archetype)&&Number.isInteger(target.x),
   "Eligible Converter and infantry target required");
 assert(dist(converter,target)<=5,"Conversion target out of range");
 assert(!converter.channel,"Converter already channeling");
 converter.channel={targetPlayer,targetId,startHp:converter.hp,startX:converter.x,startY:converter.y,
   readyAtMs:match.elapsedMs+8000};
 delete match.orders?.[converter.id];
 return {converterId,targetId,readyAtMs:converter.channel.readyAtMs};
}
export function tickConversions(match){
 for(const p of match.players)for(const converter of p.units.filter(u=>u.channel)){
  const channel=converter.channel,enemy=match.players.find(e=>e.id===channel.targetPlayer);
  const target=enemy?.units.find(u=>u.id===channel.targetId&&u.alive);
  const stability=.10+(researchMultiplier(p,"channelStability")-1);
  if(!converter.alive||!target||target.embarkedAt||target.garrisonedAt||
    converter.embarkedAt||converter.garrisonedAt||
    converter.x!==channel.startX||converter.y!==channel.startY||
    dist(converter,target)>5||channel.startHp-converter.hp>converter.maxHp*stability){
      delete converter.channel;continue;
  }
  if(match.elapsedMs<channel.readyAtMs)continue;
  delete converter.channel;
  if(p.popUsed+target.pop>p.popCap)continue;
  // Transfer the original object instead of creating duplicate pop reservations.
  enemy.units=enemy.units.filter(u=>u!==target);enemy.popUsed-=target.pop;
  p.units.push(target);p.popUsed+=target.pop;target.owner=p.id;target.faction=p.faction;
  target.nextAttackAtMs=match.elapsedMs+2000;
  delete match.orders?.[target.id];
 }
}
export function surveyAether(match,owner,workerId){
 const p=getPlayer(match,owner);
 assert(p.completed.includes("SPC-03"),"Aether survey technology required");
 const worker=p.units.find(u=>u.id===workerId&&u.alive&&u.archetype==="Worker"&&Number.isInteger(u.x));
 assert(worker,"Owned positioned worker required");
 const found=match.battlefield?.tiles.filter(t=>t.resource==="Aether"&&t.amount>0&&dist(t,worker)<=10)
  .map(t=>({x:t.x,y:t.y})).sort((a,b)=>a.y-b.y||a.x-b.x)??[];
 p.aetherSurveys??=[];
 for(const tile of found)if(!p.aetherSurveys.some(p=>p.x===tile.x&&p.y===tile.y))p.aetherSurveys.push(tile);
 return found.length;
}
export function aetherPulse(match,owner,workerId,x,y){
 const p=getPlayer(match,owner);
 assert(p.completed.includes("SPC-04"),"Aether extraction technique required");
 assert(["III","IV","V"].includes(p.age),"Aether extraction age locked");
 const worker=p.units.find(u=>u.id===workerId&&u.alive&&u.archetype==="Worker"&&
  Number.isInteger(u.x)&&!u.embarkedAt);
 assert(worker,"Owned positioned worker required");
 assert((worker.nextAetherPulseAtMs??0)<=match.elapsedMs,"Extraction pulse on cooldown");
 const tile=at(match.battlefield,x,y);
 assert(tile?.resource==="Aether"&&tile.amount>0&&dist(tile,worker)<=2,"Nearby Aether deposit required");
 const amount=Math.min(8,tile.amount);
 tile.amount-=amount;if(tile.amount===0)tile.resource=null;
 p.resources.Aether+=amount;
 worker.nextAetherPulseAtMs=match.elapsedMs+20000;
 return {amount,remaining:tile.amount};
}
