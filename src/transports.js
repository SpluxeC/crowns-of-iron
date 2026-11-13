import {assert} from "./util.js";
import {getPlayer,killUnit} from "./state.js";
import {movementDomain,tileTraversable} from "./movementDomains.js";
import {at} from "./map.js";
const CARRIERS=new Set(["Transport Ship","Air Transport","Siege Tower"]);
const distance=(a,b)=>Math.abs(a.x-b.x)+Math.abs(a.y-b.y);
function carrierAndPassenger(match,owner,carrierId,passengerId){
 const player=getPlayer(match,owner),carrier=player.units.find(u=>u.id===carrierId&&u.alive);
 const passenger=player.units.find(u=>u.id===passengerId&&u.alive);
 assert(carrier&&CARRIERS.has(carrier.archetype)&&Number.isInteger(carrier.x)&&Number.isInteger(carrier.y),"Living positioned transport required");
 assert(passenger&&passenger!==carrier,"Owned living passenger required");
 return {player,carrier,passenger};
}
function carriedPop(player,carrierId){
 return player.units.filter(u=>u.alive&&u.embarkedAt===carrierId)
   .reduce((n,u)=>n+u.pop,0);
}
export function embark(match,owner,carrierId,passengerId){
 assert(match.battlefield,"Transport requires a battlefield");
 const {player,carrier,passenger}=carrierAndPassenger(match,owner,carrierId,passengerId);
 assert(!passenger.embarkedAt&&!passenger.garrisonedAt&&Number.isInteger(passenger.x),"Passenger unavailable");
 assert(movementDomain(passenger.archetype)==="land"&&passenger.archetype!=="Hero"&&
  passenger.archetype!=="Legendary Land"&&passenger.archetype!=="Siege Tower"&&
  passenger.archetype!=="Heavy War Machine"&&passenger.archetype!=="Battering Ram",
  "Only eligible land units can embark");
 assert(distance(carrier,passenger)<=(carrier.archetype==="Siege Tower"?1:2),"Transport is too far from passenger");
 if(carrier.archetype==="Siege Tower")assert(["Club Fighter","Stone Spearman","Stone Slinger","Swordsman","Archer","Pikeman","Heavy Infantry","Gunner","Anti-Air Infantry"].includes(passenger.archetype),"Siege Tower accepts infantry only");
 assert(carriedPop(player,carrierId)+passenger.pop<=carrier.passengerCapacity,
  "Transport passenger population capacity exceeded");
 carrier.passengerIds??=[];
 assert(!carrier.passengerIds.includes(passenger.id),"Passenger already aboard");
 carrier.passengerIds.push(passenger.id);
 passenger.embarkedAt=carrierId;
 passenger.x=null;passenger.y=null;
 delete match.orders?.[passenger.id];
 delete match.harvestJobs?.[passenger.id];
 return {carrierId,passengerId,occupied:carriedPop(player,carrierId),capacity:carrier.passengerCapacity};
}
function exits(match,owner,carrier){
 const candidates=[];
 // Disembark on accessible land at most two steps from the transport.
 for(let y=carrier.y-2;y<=carrier.y+2;y++)for(let x=carrier.x-2;x<=carrier.x+2;x++){
  if(Math.abs(carrier.x-x)+Math.abs(carrier.y-y)>2)continue;
  if(!tileTraversable(match,owner,"Worker",x,y))continue;
  // No two passengers may be placed on the same tile during one unload operation.
  candidates.push({x,y});
 }
 return candidates.sort((a,b)=>distance(a,carrier)-distance(b,carrier)||a.y-b.y||a.x-b.x);
}
export function disembark(match,owner,carrierId,passengerIds){
 const player=getPlayer(match,owner);
 const carrier=player.units.find(u=>u.id===carrierId&&u.alive&&CARRIERS.has(u.archetype));
 assert(carrier&&Number.isInteger(carrier.x)&&Number.isInteger(carrier.y),"Living positioned transport required");
 assert(Array.isArray(passengerIds)&&passengerIds.length>0&&new Set(passengerIds).size===passengerIds.length,
  "Nonempty unique passenger list required");
 const owned=passengerIds.map(id=>player.units.find(u=>u.id===id&&u.alive&&u.embarkedAt===carrierId));
 assert(owned.every(Boolean),"All passengers must be aboard this transport");
 const occupied=new Set(match.players.flatMap(p=>p.units.filter(u=>u.alive&&Number.isInteger(u.x))
  .map(u=>u.x+","+u.y)));
 const land=exits(match,owner,carrier).filter(t=>!occupied.has(t.x+","+t.y));
 assert(land.length>=owned.length,"Insufficient safe landing tiles");
 for(let i=0;i<owned.length;i++){
  owned[i].x=land[i].x;owned[i].y=land[i].y;owned[i].embarkedAt=null;
 }
 carrier.passengerIds=(carrier.passengerIds??[]).filter(id=>!passengerIds.includes(id));
 return owned.map(u=>({unitId:u.id,x:u.x,y:u.y}));
}
function exitsForWreck(match,owner,carrier){
 return exits(match,owner,carrier);
}
export function transportLosses(match){
 // Destroyed transports cannot retain invulnerable, hidden living passengers.
 for(const player of match.players)for(const unit of player.units){
  if(!unit.alive||!unit.embarkedAt)continue;
  const carrier=player.units.find(u=>u.id===unit.embarkedAt);
  if(carrier?.alive)continue;
  unit.embarkedAt=null;
  if(carrier?.archetype==="Siege Tower"&&Number.isInteger(carrier.x)){
    const exits=exitsForWreck(match,player.id,carrier);
    const taken=new Set(match.players.flatMap(p=>p.units.filter(u=>u.alive&&Number.isInteger(u.x)).map(u=>u.x+","+u.y)));
    const point=exits.find(t=>!taken.has(t.x+","+t.y));
    if(point){
      unit.x=point.x;unit.y=point.y;
      unit.hp=Math.max(1,unit.hp-Math.ceil(unit.maxHp*.35));
      continue;
    }
  }
  killUnit(player,unit.id);
 }
}
export function transportCapacity(player,carrierId){
 const carrier=player.units.find(u=>u.id===carrierId&&u.alive&&CARRIERS.has(u.archetype));
 assert(carrier,"Transport unavailable");
 return {capacity:carrier.passengerCapacity,used:carriedPop(player,carrierId)};
}
