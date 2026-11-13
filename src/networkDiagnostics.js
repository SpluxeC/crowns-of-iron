import {assert} from "./util.js";
import {MatchHost} from "./network.js";
import {makeUnit} from "./state.js";
import {ARCHETYPES} from "./catalog.js";
import {checksum} from "./simulation.js";
const factions=["Humans","Orcs","Dwarfs","Tree Elves","Corrupt Elves","Ursa","Humans","Orcs"];
/**
 * Reproducible local stress fixture: 8 participants * 300 pop.
 * Not an Internet latency / matchmaking / security benchmark.
 */
export function runLocalHostStress({seed=99,players=8,population=300,ticks=3}={}){
 assert(Number.isSafeInteger(players)&&players>=2&&players<=8,"Invalid stress player count");
 assert(Number.isSafeInteger(population)&&population>=4&&population<=300,"Invalid population cap");
 assert(Number.isSafeInteger(ticks)&&ticks>=1&&ticks<=20,"Invalid stress tick count");
 const host=new MatchHost(factions.slice(0,players).map((f,i)=>({id:"p"+i,faction:f})),seed);
 let count=0;
 for(const [i,p] of host.match.players.entries()){
  const home=host.match.battlefield.starts[i];
  while(p.popUsed<population){
   const unit=makeUnit(p,"Swordsman",ARCHETYPES.Swordsman,p.id+"-stress-"+p.popUsed);
   unit.x=home.x;unit.y=home.y;p.units.push(unit);p.popUsed++;count++;
  }
  p.popCap=population;
 }
 const before=checksum(host.match),auth=host.credentialsFor("p0").token;
 const snapshot=host.view(auth);
 assert(snapshot.state.players[0].units.length===population,"Missing owned stress units");
 for(let i=0;i<ticks;i++)host.advance(1000);
 const resync=host.resync({token:auth,afterVersion:0});
 assert(resync.version===ticks,"Stale stress state version");
 assert(resync.state.players.slice(1).every(p=>!p.resources),"Enemy private resources leaked");
 return {players,populationPerPlayer:population,totalUnits:players*population,
  additionalUnits:count,ticks,initialChecksum:before,
  finalChecksum:checksum(host.match),serverVersion:host.version,
  clientChecksum:resync.checksum};
}
