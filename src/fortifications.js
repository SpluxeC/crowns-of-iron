import {assert} from "./util.js";
import {at} from "./map.js";
import {getPlayer,killUnit} from "./state.js";
import {damage} from "./combat.js";
import {hasLineOfSight} from "./tacticalNavigation.js";
import {researchMultiplier} from "./technologyEffects.js";

const GARRISON={
  "Primitive Gate":{capacity:2,slots:1,range:4,attack:10,ms:2700,type:"Pierce"},
  Watchtower:{capacity:2,slots:1,range:6,attack:20,ms:2500,type:"Pierce"},
  Fortress:{capacity:8,slots:3,range:8,attack:32,ms:2400,type:"Pierce"},
  "Stone Gatehouse":{capacity:4,slots:2,range:5,attack:18,ms:2700,type:"Pierce"},
  "Artillery Bastion":{capacity:3,slots:2,range:10,attack:60,ms:4000,type:"Crush"},
  "Anti-Air Tower":{capacity:2,slots:2,range:9,attack:45,ms:2300,type:"Pierce"}
};
const allowed=new Set(["Club Fighter","Stone Spearman","Stone Slinger","Swordsman",
 "Archer","Pikeman","Heavy Infantry","Gunner","Anti-Air Infantry"]);
const distance=(p,s)=>Math.max(s.x-p.x,0,p.x-(s.x+s.width-1))+
 Math.max(s.y-p.y,0,p.y-(s.y+s.height-1));
const aim=(p,s)=>({x:Math.min(s.x+s.width-1,Math.max(s.x,p.x)),
 y:Math.min(s.y+s.height-1,Math.max(s.y,p.y))});
export function garrisonRules(kind){return GARRISON[kind]??null;}
export function garrisonUnit(match,owner,siteId,unitId){
 const site=match.constructions?.[siteId],location=match.battlefield?.structures.find(s=>s.id===siteId);
 const rule=site&&GARRISON[site.kind],p=getPlayer(match,owner);
 assert(site?.completed&&location&&rule,"No completed garrison-capable structure");
 if(site.kind==="Primitive Gate")assert(p.completed.includes("BLD-03"),"Primitive defensive fittings required");
 assert(site.owner===owner,"Cannot garrison enemy structure");
 const unit=p.units.find(u=>u.id===unitId&&u.alive);
 assert(unit&&allowed.has(unit.archetype)&&Number.isInteger(unit.x)&&!unit.garrisonedAt&&!unit.embarkedAt,
  "Only positioned infantry may garrison");
 assert(distance(unit,location)<=1,"Infantry must be next to structure");
 site.garrisonIds??=[];
 assert(site.garrisonIds.length<rule.capacity,"Garrison capacity reached");
 assert(!site.garrisonIds.includes(unitId),"Unit already garrisoned");
 site.garrisonIds.push(unitId);
 unit.garrisonedAt=siteId;unit.x=null;unit.y=null;
 delete match.orders?.[unitId];
 delete match.harvestJobs?.[unitId];
 return {siteId,unitId};
}
function exitTiles(map,location){
 const tiles=[];
 for(let y=location.y-1;y<=location.y+location.height;y++)
  for(let x=location.x-1;x<=location.x+location.width;x++){
   if(x>=location.x&&x<location.x+location.width&&y>=location.y&&y<location.y+location.height)continue;
   const t=at(map,x,y);
   if(t&&t.terrain!=="water"&&t.terrain!=="hill"&&t.occupied===null)tiles.push(t);
  }
 return tiles.sort((a,b)=>a.y-b.y||a.x-b.x);
}
export function ungarrisonUnit(match,owner,unitId){
 const p=getPlayer(match,owner),unit=p.units.find(u=>u.id===unitId&&u.alive&&u.garrisonedAt);
 assert(unit,"Owned unit is not garrisoned");
 const site=match.constructions?.[unit.garrisonedAt];
 const location=match.battlefield?.structures.find(s=>s.id===unit.garrisonedAt);
 assert(site&&site.owner===owner&&location,"Garrison structure missing");
 const exit=exitTiles(match.battlefield,location)[0];
 assert(exit,"No clear garrison exit");
 site.garrisonIds=site.garrisonIds.filter(id=>id!==unitId);
 unit.x=exit.x;unit.y=exit.y;unit.garrisonedAt=null;
 return {unitId,x:unit.x,y:unit.y};
}
export function evacuateGarrison(match,site){
 const location=match.battlefield?.structures.find(s=>s.id===site.siteId);
 if(!location)return;
 const p=getPlayer(match,site.owner),tiles=exitTiles(match.battlefield,location);
 for(const id of site.garrisonIds??[]){
   const unit=p.units.find(u=>u.id===id&&u.alive&&u.garrisonedAt===site.siteId);
   if(!unit)continue;
   const tile=tiles.shift();
   unit.garrisonedAt=null;
   if(!tile)killUnit(p,id);
   else{
    unit.x=tile.x;unit.y=tile.y;
    unit.hp=Math.max(1,unit.hp-Math.ceil(unit.maxHp*.35));
   }
 }
 site.garrisonIds=[];
}
export function tickFortificationFire(match){
 if(!match.battlefield)return [];
 const results=[];
 for(const site of Object.values(match.constructions??{}).sort((a,b)=>a.siteId.localeCompare(b.siteId))){
   const rule=GARRISON[site.kind];
   if(!site.completed||!rule||!site.garrisonIds?.length)continue;
   if((site.disruptedUntilMs??0)>match.elapsedMs)continue;
   if((site.nextFireAtMs??0)>match.elapsedMs)continue;
   const loc=match.battlefield.structures.find(s=>s.id===site.siteId);
   const owner=getPlayer(match,site.owner);
   if(!loc)continue;
   const enemies=match.players.filter(p=>p.team!==owner.team&&!p.defeated).flatMap(p=>
     p.units.filter(u=>u.alive&&!u.garrisonedAt&&Number.isInteger(u.x)&&
       (u.category!=="Air"||site.kind==="Anti-Air Tower")&&distance(u,loc)<=rule.range&&
       (u.category==="Air"||hasLineOfSight(match.battlefield,aim(u,loc),u)))
     .map(u=>({player:p,unit:u})));
   enemies.sort((a,b)=>distance(a.unit,loc)-distance(b.unit,loc)||
      a.unit.hp-b.unit.hp||a.unit.id.localeCompare(b.unit.id));
   if(!enemies.length)continue;
   const slots=Math.min(site.garrisonIds.length,rule.slots+(owner.completed.includes("BLD-07")?1:0));
   const target=enemies[0];
   const hit=damage(rule.attack*slots,target.unit.armor,rule.type,target.unit.category,
     site.kind==="Anti-Air Tower"&&target.unit.category==="Air"?1.5:0);
   target.unit.hp=Math.max(0,target.unit.hp-hit);
   if(target.unit.hp===0)killUnit(target.player,target.unit.id);
   site.nextFireAtMs=match.elapsedMs+rule.ms;
   results.push({siteId:site.siteId,targetId:target.unit.id,damage:hit});
 }
 return results;
}
