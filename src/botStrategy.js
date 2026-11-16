/** Local full-catalog AI stance selection without hidden player input or randomness.
 * Uses only authoritative positions and deterministic integer comparisons. */
import {threatenedLocations} from "./botTargeting.js";
const distance=(a,b)=>Math.abs(a.x-b.x)+Math.abs(a.y-b.y);
const DEPTH={Easy:7,Normal:10,Hard:13};
export function assessBotThreat(match,owner){
 const player=match.players.find(p=>p.id===owner);
 const start=match.battlefield?.starts[match.players.indexOf(player)];
 if(!player||!start)return {nearby:0,workersThreatened:0,army:0,enemyArmy:0,nearest:Infinity};
 const military=player.units.filter(u=>u.alive&&u.attack>0&&u.archetype!=="Worker"&&
  Number.isInteger(u.x));
 const enemies=match.players.filter(p=>p.team!==player.team&&!p.defeated)
  .flatMap(p=>p.units.filter(u=>u.alive&&Number.isInteger(u.x)));
 const radius=DEPTH[match.bots?.[owner]?.difficulty]??10;
 const protectedPoints=match.fullCatalog?threatenedLocations(match,owner):[start];
 const hostileMilitary=enemies.filter(u=>u.attack>0&&u.archetype!=="Worker");
 const nearby=hostileMilitary.filter(u=>protectedPoints.some(pt=>distance(u,pt)<=radius));
 const workers=player.units.filter(u=>u.alive&&u.archetype==="Worker"&&Number.isInteger(u.x));
 return {nearby:nearby.length,
  workersThreatened:workers.filter(w=>hostileMilitary.some(e=>distance(e,w)<=4)).length,
  army:military.length,enemyArmy:enemies.filter(u=>u.attack>0).length,
  nearest:enemies.reduce((n,u)=>Math.min(n,distance(start,u)),Infinity)};
}
export function chooseBotStrategy(match,owner){
 const bot=match.bots?.[owner],p=match.players.find(x=>x.id===owner);
 if(!bot||!p||p.defeated)return null;
 const t=assessBotThreat(match,owner),prior=bot.stance??"assault";
 // Preserve decisions for a minimum interval to avoid order thrashing.
 const cooldown=bot.stanceChangedAtMs??-Infinity;
 // Emergency defense preempts an offensive stance even inside its cooldown.
 // The cooldown still prevents premature retreat from defense or raid thrashing.
 const emergency=t.workersThreatened>0||
  t.nearby>=Math.max(2,Math.floor(t.army*.65));
 if(match.elapsedMs-cooldown<15000&&!(emergency&&prior!=="defend"))
  return {stance:prior,changed:false,threat:t};
 let stance="assault";
 if(emergency)stance="defend";
 else if(bot.difficulty!=="Easy"&&t.army>=6&&t.army>=t.enemyArmy+2)
  stance="raid";
 if(prior!==stance){
  bot.stance=stance;
  bot.stanceChangedAtMs=match.elapsedMs;
 }
 return {stance,changed:prior!==stance,threat:t};
}
