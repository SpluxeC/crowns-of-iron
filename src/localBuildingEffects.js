import {assert,spend} from "./util.js";
import {getPlayer} from "./state.js";
const distance=(a,b)=>Math.max(b.x-a.x,0,a.x-(b.x+b.width-1))+Math.max(b.y-a.y,0,a.y-(b.y+b.height-1));
export function staffedHospitalHeal(match,owner,siteId,healerIds,targetId){
 const p=getPlayer(match,owner),s=match.constructions?.[siteId],loc=match.battlefield?.structures.find(x=>x.id===siteId);
 assert(s?.completed&&s.owner===owner&&s.kind==="Field Hospital"&&loc,"Owned hospital required");
 assert(Array.isArray(healerIds)&&healerIds.length>0&&healerIds.length<=4&&new Set(healerIds).size===healerIds.length,"Invalid healers");
 const target=p.units.find(u=>u.id===targetId&&u.alive&&Number.isInteger(u.x)&&u.category!=="Mechanical");
 assert(target&&distance(target,loc)<=2,"Eligible nearby patient required");
 const staff=healerIds.map(id=>p.units.find(u=>u.id===id&&u.alive&&u.archetype==="Healer"&&Number.isInteger(u.x)&&distance(u,loc)<=2&&(u.nextHealAtMs??0)<=match.elapsedMs));
 assert(staff.every(Boolean),"Staffed healer unavailable");
 const used=p.units.filter(u=>u.alive&&Number.isInteger(u.x)&&u.category!=="Mechanical"&&distance(u,loc)<=2).reduce((n,u)=>n+u.pop,0);
 assert(used<=8+(s.patientCapacityBonus??0),"Patient capacity exceeded");
 const base=staff.reduce((n,_,i)=>n+12*(i<2?1:i===2?.75:.5),0);
 const restored=Math.min(target.maxHp-target.hp,Math.floor(base*1.1*(s.staffedHealingMultiplier??1)));
 target.hp+=restored;
 if(restored>0)for(const h of staff)h.nextHealAtMs=match.elapsedMs+2000;
 return restored;
}
export function staffedVehicleRepair(match,owner,siteId,workerIds,targetId,amount){
 const p=getPlayer(match,owner),s=match.constructions?.[siteId],loc=match.battlefield?.structures.find(x=>x.id===siteId);
 const upgrade=s?.kind==="Dock"?"Repair Yard":s?.kind==="Airship Hangar"?"Maintenance Bay":null;
 assert(s?.completed&&s.owner===owner&&loc&&upgrade&&s.upgrades?.includes(upgrade),"Upgraded owned repair facility required");
 assert(Array.isArray(workerIds)&&workerIds.length>0&&workerIds.length<=4&&new Set(workerIds).size===workerIds.length,"Invalid repair team");
 assert(Number.isSafeInteger(amount)&&amount>0,"Invalid repair amount");
 const ship=new Set(["Raft","Fishing Vessel","Trade Ship","Transport Ship","Light Warship","Heavy Warship","Naval Siege Ship","Legendary Warship"]);
 const air=new Set(["Scout Aircraft","Interceptor","Gunship","Bomber","Air Transport","Aerial Battleship"]);
 const target=p.units.find(u=>u.id===targetId&&u.alive&&Number.isInteger(u.x)&&distance(u,loc)<=2&&
   (upgrade==="Repair Yard"?ship.has(u.archetype):air.has(u.archetype)));
 assert(target,"Eligible nearby damaged vehicle required");
 const staff=workerIds.map(id=>p.units.find(u=>u.id===id&&u.alive&&u.archetype==="Worker"&&Number.isInteger(u.x)&&distance(u,loc)<=2&&(u.nextRepairAtMs??0)<=match.elapsedMs));
 assert(staff.every(Boolean),"Repair workers unavailable");
 const restored=Math.min(target.maxHp-target.hp,amount,Math.floor(staff.length*40*(s.vehicleRepairMultiplier??1)));
 if(restored<=0)return {restored:0,cost:{}};
 const cost=Object.fromEntries(["Wood","Stone","Metal"].map(k=>[k,Math.ceil(.5*(target.cost[k]??0)*restored/target.maxHp)]));
 spend(p.resources,cost);target.hp+=restored;
 for(const w of staff)w.nextRepairAtMs=match.elapsedMs+2000;
 return {restored,cost};
}
