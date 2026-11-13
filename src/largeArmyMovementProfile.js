import {performance} from "node:perf_hooks";
import {MatchHost} from "./network.js";
import {makeMap} from "./map.js";
import {makeUnit} from "./state.js";
import {ARCHETYPES} from "./catalog.js";
import {enableUnitCollision,validateCollisionState} from "./unitCollision.js";
import {assert} from "./util.js";
import {percentile} from "../web/perfTelemetry.js";
const FACTIONS=["Humans","Orcs","Dwarfs","Tree Elves","Corrupt Elves","Ursa","Humans","Orcs"];
/** Headless local 8x300 population, with 64 truly moving orders and no GPU/network load. */
export function runLargeArmyMovementProfile({seed=730,ticks=3}={}){
 assert(Number.isSafeInteger(ticks)&&ticks>=1&&ticks<=6,
  "Invalid profile tick count");
 const host=new MatchHost(FACTIONS.map((f,i)=>({id:"p"+i,faction:f})),seed);
 const map=makeMap({width:128,height:128,seed,players:8});
 for(const tile of map.tiles){tile.terrain="grass";tile.resource=null;tile.occupied=null;}
 host.match.battlefield=map;
 const moving=[];
 for(const [index,p] of host.match.players.entries()){
  p.popCap=300;
  while(p.units.length<300){
   const unit=makeUnit(p,"Swordsman",ARCHETYPES.Swordsman,
    p.id+"-profile-"+p.units.length);
   p.units.push(unit);p.popUsed+=unit.pop;
  }
  const homeX=4+(index%4)*31,homeY=5+Math.floor(index/4)*58;
  for(let k=0;k<p.units.length;k++){
   const u=p.units[k];
   u.x=k<8?homeX+1:homeX+8+(k-8)%20;
   u.y=k<8?homeY+k:homeY+Math.floor((k-8)/20);
   if(k<8)moving.push({owner:p.id,sequence:k+1,unit:u,fromX:u.x,fromY:u.y,
    target:{x:homeX+5,y:homeY+k}});
  }
 }
 enableUnitCollision(host.match,{spreadStarts:false});
 assert(validateCollisionState(host.match).overlaps.length===0,"Profile setup overlaps");
 for(const move of moving){
  host.submit({token:host.credentialsFor(move.owner).token,
   sequence:move.sequence,
   action:"attackMove",payload:{unitId:move.unit.id,...move.target}});
 }
 const samples=[];
 for(let i=0;i<ticks;i++){
  const begin=performance.now();
  host.advance(1000);
  samples.push(performance.now()-begin);
  assert(validateCollisionState(host.match).overlaps.length===0,"Movement overlaps");
 }
 const displaced=moving.filter(m=>m.unit.x!==m.fromX||m.unit.y!==m.fromY).length;
 return {players:8,populationPerPlayer:300,totalUnits:2400,issuedAttackMoveOrders:moving.length,
  movedUnits:displaced,ticks,
  tickMs:{p50:percentile(samples,.5),p95:percentile(samples,.95),
   worst:Math.max(...samples)},
  overlaps:0,scope:"headless local Node CPU measurements, no GPU, Internet latency, or battle balancing"};
}
