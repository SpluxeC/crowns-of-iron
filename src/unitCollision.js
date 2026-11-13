import {assert} from "./util.js";
import {tileTraversable,movementDomain} from "./movementDomains.js";
const id=(x,y)=>x+","+y;
export function occupancyDomain(u){return movementDomain(u.archetype);}
export function occupiedCells(match,ignoreUnitId=null){
 const blocked={land:new Map(),naval:new Map()};
 for(const p of match.players)for(const u of p.units){
  if(!u.alive||!Number.isInteger(u.x)||u.id===ignoreUnitId||u.embarkedAt||u.garrisonedAt)continue;
  const domain=occupancyDomain(u);
  if(blocked[domain]){
    const k=id(u.x,u.y),units=blocked[domain].get(k)??[];
    units.push(u.id);blocked[domain].set(k,units);
  }
 }
 return blocked;
}
export function isOccupiedByUnit(match,unit,x,y){
 if(!match.unitCollision||occupancyDomain(unit)==="air")return false;
 return (occupiedCells(match,unit.id)[occupancyDomain(unit)]?.get(id(x,y))?.length??0)>0;
}
/** Optional deterministic collision model; legacy balance benchmarks stay unchanged. */
export function enableUnitCollision(match,{spreadStarts=true}={}){
 assert(match.battlefield&&match.tick===0&&match.elapsedMs===0,"Enable collision before simulation starts");
 assert(typeof spreadStarts==="boolean","Invalid collision configuration");
 match.unitCollision=true;
 if(spreadStarts){
  const used=new Set();
  for(const p of match.players)for(const u of p.units){
   if(!u.alive||!Number.isInteger(u.x)||occupancyDomain(u)==="air")continue;
   const domain=occupancyDomain(u),base={x:u.x,y:u.y};
   let position=null;
   for(let radius=0;radius<=8&&!position;radius++)
    for(let y=base.y-radius;y<=base.y+radius&&!position;y++)
     for(let x=base.x-radius;x<=base.x+radius;x++){
      if(Math.abs(x-base.x)+Math.abs(y-base.y)>radius)continue;
      if(tileTraversable(match,p.id,u.archetype,x,y)&&!used.has(domain+":"+id(x,y))){
       position={x,y};break;
      }
     }
   assert(position,"Cannot place initial units without collisions");
   u.x=position.x;u.y=position.y;used.add(domain+":"+id(u.x,u.y));
  }
 }
 return true;
}
export function validateCollisionState(match){
 if(!match.unitCollision)return {enabled:false,overlaps:[]};
 const occupancy=occupiedCells(match);
 const overlaps=Object.entries(occupancy).flatMap(([domain,cells])=>[...cells.entries()]
  .filter(([_,ids])=>ids.length>1).map(([cell,ids])=>({domain,cell,ids})));
 return {enabled:true,overlaps};
}
