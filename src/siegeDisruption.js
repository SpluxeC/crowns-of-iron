import {assert} from "./util.js";
import {getPlayer} from "./state.js";
import {researchMultiplier} from "./technologyEffects.js";
const dist=(u,s)=>Math.max(s.x-u.x,0,u.x-s.x-s.width+1)+
 Math.max(s.y-u.y,0,u.y-s.y-s.height+1);
const FORTS=new Set(["Watchtower","Fortress","Stone Gatehouse","Artillery Bastion","Anti-Air Tower"]);
export function disruptFortification(match,owner,unitId,siteId){
 const p=getPlayer(match,owner),unit=p.units.find(u=>u.id===unitId&&u.alive&&
  ["Heavy Artillery","Heavy War Machine","Naval Siege Ship"].includes(u.archetype)&&
  Number.isInteger(u.x)&&!u.embarkedAt&&!u.garrisonedAt);
 const site=match.constructions?.[siteId],s=match.battlefield?.structures.find(s=>s.id===siteId);
 const defending=match.players.find(p=>p.id===site?.owner);
 assert(unit&&site?.completed&&s&&FORTS.has(site.kind)&&defending?.team!==p.team,
  "Valid enemy fortification and siege weapon required");
 assert(dist(unit,s)<=7,"Fortification out of siege disruption range");
 assert((unit.nextDisruptionAtMs??0)<=match.elapsedMs,"Siege disruption on cooldown");
 const duration=Math.round(10000*researchMultiplier(p,"siegeDisruption"));
 site.disruptedUntilMs=Math.max(site.disruptedUntilMs??0,match.elapsedMs+duration);
 unit.nextDisruptionAtMs=match.elapsedMs+30000;
 return {siteId,durationMs:duration};
}
