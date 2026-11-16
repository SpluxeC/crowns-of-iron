/** Deterministic AI base planner for browser-local skirmishes.
 * Builds a limited economy and military footprint without cheating resources. */
import {canPlace} from "./map.js";
import {startConstruction} from "./construction.js";
import {constructionDefinition} from "./structureCatalog.js";
import {STRUCTURES} from "./construction.js";
import {ageIndex,affordable} from "./util.js";
import {cancelHarvestJob} from "./spatialEconomy.js";
import {canFundOptionalSpend} from "./botResearchPlanner.js";
const MAX_SITES={Shelter:3,"Training Camp":1,Farm:2,Barracks:2,"Archery Range":1,
 "Resource Depot":2,Forge:1,Academy:1,"Siege Workshop":1,
 "Field Hospital":1,Foundry:1,"Airship Hangar":1,"Grand Factory":1};
const ageAllowed=(p,def)=>ageIndex(p.age)>=ageIndex(def.age);
function siteCount(match,p,kind){
 return Object.values(match.constructions??{}).filter(s=>s.owner===p.id&&s.kind===kind).length;
}
export function desiredBotBuilding(match,player){
 if(!match.battlefield)return null;
 const alive=player.units.filter(u=>u.alive).length;
 const waiting=Object.values(player.unitQueues).flat().length;
 const want=[
  ...(player.popCap-alive-waiting<=4?[ "Shelter" ]:[]),
  "Training Camp",
  ...(player.age!=="I"?["Farm","Barracks","Archery Range","Forge"]:[]),
  ...(player.age!=="I"?["Resource Depot"]:[]),
  ...(["III","IV","V"].includes(player.age)?
   ["Academy","Siege Workshop","Field Hospital"]:[]),
  ...(["IV","V"].includes(player.age)?["Foundry","Airship Hangar"]:[]),
  ...(player.age==="V"?["Grand Factory"]:[]),
  ...(alive+waiting>=player.popCap-3?["Shelter"]:[])
 ];
 for(const kind of want){
  const def=constructionDefinition(match,player,kind,STRUCTURES);
  if(!def||!ageAllowed(player,def)||!affordable(player.resources,def.cost))continue;
  // A military or utility expansion should never consume funds earmarked for
  // the next mandatory civilization technology. Housing remains emergency.
  if(kind!=="Shelter"&&!canFundOptionalSpend(match,player,def.cost))continue;
  if(siteCount(match,player,kind)>=(MAX_SITES[kind]??1))continue;
  const existing=Object.values(match.constructions??{}).find(s=>
   s.owner===player.id&&s.kind===kind&&!s.completed);
  if(existing)continue;
  return {kind,def};
 }
 return null;
}
/** Reserve the shared Town Center drop-off and straight roads to its start
 * deposits. Blocking these tiles can deadlock every harvesting worker. */
export function blocksBaseLogistics(map,x,y,width,height){
 return map.starts.some(start=>{
  for(let yy=y;yy<y+height;yy++)for(let xx=x;xx<x+width;xx++){
   const dx=xx-start.x,dy=yy-start.y;
   if(Math.abs(dx)<=1&&Math.abs(dy)<=1)return true;
   if(dy===0&&Math.abs(dx)<=3)return true;
   if(dx===0&&Math.abs(dy)<=3)return true;
  }
  return false;
 });
}
export function tryBotConstruction(match,player){
 const plan=desiredBotBuilding(match,player);
 if(!plan)return null;
 const map=match.battlefield,start=map.starts[match.players.indexOf(player)];
 if(!start)return null;
 const workers=player.units.filter(u=>u.alive&&u.archetype==="Worker"&&
  Number.isInteger(u.x)&&Number.isInteger(u.y));
 const busy=new Set(Object.values(match.constructions??{}).filter(s=>!s.completed)
  .flatMap(s=>s.workerIds??[]));
 workers.sort((a,b)=>Number(!!match.harvestJobs?.[a.id])-Number(!!match.harvestJobs?.[b.id])||
  a.id.localeCompare(b.id));
 const builder=workers.find(u=>!busy.has(u.id));
 if(!builder)return null;
 const [w,h]=plan.def.footprint;
 // Test sites nearest the builder first so the build validator performs
 // authoritative reachability, affordability and coast restrictions.
 const options=[];
 for(let y=Math.max(0,start.y-9);y<=Math.min(map.height-h,start.y+9);y++)
  for(let x=Math.max(0,start.x-9);x<=Math.min(map.width-w,start.x+9);x++){
   if(!canPlace(map,x,y,w,h)||blocksBaseLogistics(map,x,y,w,h))continue;
   options.push({x,y,score:Math.abs(x-builder.x)+Math.abs(y-builder.y)+
    Math.abs(x-start.x)*.2+Math.abs(y-start.y)*.2});
  }
 options.sort((a,b)=>a.score-b.score||a.y-b.y||a.x-b.x);
 for(const {x,y} of options){
  try{
   const siteId=startConstruction(match,player.id,plan.kind,x,y,[builder.id]);
   // Preserve pre-existing harvest orders until construction is actually valid.
   if(match.harvestJobs?.[builder.id])cancelHarvestJob(match,player.id,builder.id);
   if(match.orders)delete match.orders[builder.id];
   return {siteId,kind:plan.kind,workerId:builder.id};
  }catch(e){
   if(/reach|placement|Coastal|water|site/.test(e.message))continue;
   // Budget, tech and other validation errors are not path search failures.
   return null;
  }
 }
 return null;
}
