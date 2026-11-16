/** Deterministic tactical focus planning for full-catalog AI.
 * Group target scoring is independent of player-array ordering and never
 * mutates the economy or unit stats. */
import {canEngage} from "./engagementRules.js";
export const gridDistance=(a,b)=>Math.abs(a.x-b.x)+Math.abs(a.y-b.y);
export function threatenedLocations(match,owner,radius=12){
 const p=match.players.find(x=>x.id===owner);
 if(!p||!match.battlefield)return [];
 const i=match.players.indexOf(p),start=match.battlefield.starts[i];
 const workers=p.units.filter(u=>u.alive&&u.archetype==="Worker"&&
   Number.isInteger(u.x)).map(u=>({x:u.x,y:u.y}));
 const buildings=match.battlefield.structures.filter(s=>s.owner===owner)
  .map(s=>({x:s.x+Math.floor(s.width/2),y:s.y+Math.floor(s.height/2)}));
 return [start,...buildings,...workers].filter(Boolean).sort((a,b)=>
  a.x-b.x||a.y-b.y).filter((pt,k,array)=>
   array.findIndex(t=>t.x===pt.x&&t.y===pt.y)===k);
}
export function selectSquadObjective(match,owner,stance,army){
 const p=match.players.find(x=>x.id===owner);
 if(!p||!army?.length)return null;
 const start=match.battlefield.starts[match.players.indexOf(p)];
 const defenders=threatenedLocations(match,owner);
 const enemies=match.players.filter(x=>x.team!==p.team&&!x.defeated)
  .flatMap(foe=>foe.units.filter(u=>u.alive&&Number.isInteger(u.x)&&
   !u.garrisonedAt&&!u.embarkedAt).map(unit=>({owner:foe.id,unit})));
 if(!enemies.length)return null;
 // Only select objectives that at least one member can actually attack.
 // A defensive squad prioritizes armed intruders, not harmless workers.
 const candidates=enemies.filter(({unit})=>
  army.some(attacker=>attacker.attack>0&&canEngage(attacker,unit))&&
  (stance!=="defend"||(unit.attack>0&&unit.archetype!=="Worker"&&
   defenders.some(point=>gridDistance(point,unit)<=9))));
 if(!candidates.length)return null;
 const center={x:Math.round(army.reduce((a,u)=>a+u.x,0)/army.length),
  y:Math.round(army.reduce((a,u)=>a+u.y,0)/army.length)};
 return [...candidates].sort((a,b)=>{
  function cost(entry){
   const u=entry.unit;
   const baseDistance=gridDistance(center,u);
   const nearBase=gridDistance(start,u);
   const threat=defenders.reduce((best,pt)=>
    Math.min(best,gridDistance(pt,u)),Infinity);
   const workerBonus=stance==="raid"&&u.archetype==="Worker"?-45:0;
   const defensive=stance==="defend"?threat*12:nearBase*.15;
   const siegeBonus=["Heavy Artillery","Bomber"].includes(u.archetype)?-15:0;
   return baseDistance*4+defensive+workerBonus+siegeBonus+
    Math.round(u.hp/40);
  }
  return cost(a)-cost(b)||a.owner.localeCompare(b.owner)||
    a.unit.id.localeCompare(b.unit.id);
 })[0];
}
