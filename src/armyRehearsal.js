import {assert} from "./util.js";
import {MatchHost} from "./network.js";
import {makeUnit} from "./state.js";
import {ARCHETYPES} from "./catalog.js";
import {enableUnitCollision,validateCollisionState} from "./unitCollision.js";
import {checksum} from "./simulation.js";
const FACTIONS=["Humans","Orcs","Dwarfs","Tree Elves","Corrupt Elves","Ursa","Humans","Orcs"];
/** Eight-player, server-side army-order rehearsal: not real client latency or GPU load. */
export function runArmyRehearsal({seed=609,ticks=3}={}){
 assert(Number.isSafeInteger(ticks)&&ticks>=1&&ticks<=12,"Invalid rehearsal ticks");
 const people=FACTIONS.map((f,i)=>({id:"p"+i,faction:f})),host=new MatchHost(people,seed);
 const map=host.match.battlefield;
 for(const tile of map.tiles){tile.terrain="grass";tile.occupied=null;tile.resource=null;}
 enableUnitCollision(host.match);
 const used=new Set(host.match.players.flatMap(p=>p.units.map(u=>u.x+","+u.y)));
 let formed=0;
 for(const [i,p] of host.match.players.entries()){
  p.popCap=300;
  const home=map.starts[i],ids=[];
  for(let radius=1;ids.length<24&&radius<11;radius++){
   for(let dy=-radius;dy<=radius&&ids.length<24;dy++)
    for(let dx=-radius;dx<=radius&&ids.length<24;dx++){
     if(Math.abs(dx)+Math.abs(dy)!==radius)continue;
     const x=home.x+dx,y=home.y+dy,k=x+","+y;
     if(x<0||y<0||x>=map.width||y>=map.height||used.has(k))continue;
     const u=makeUnit(p,"Swordsman",ARCHETYPES.Swordsman,p.id+"-army-"+ids.length);
     u.x=x;u.y=y;p.units.push(u);p.popUsed+=u.pop;ids.push(u.id);used.add(k);
    }
  }
  assert(ids.length===24,"Not enough rehearsal spawn positions");
  const target={x:home.x+Math.sign(map.width/2-home.x)*6,
    y:home.y+Math.sign(map.height/2-home.y)*6};
  const result=host.submit({token:host.credentialsFor(p.id).token,sequence:1,
    action:"formation",payload:{units:ids,...target}});
  assert(result.accepted&&result.result.length===24,"Formation rejected");
  formed++;
 }
 assert(validateCollisionState(host.match).overlaps.length===0,"Spawn overlap");
 for(let i=0;i<ticks;i++)host.advance(1000);
 const overlaps=validateCollisionState(host.match).overlaps;
 assert(overlaps.length===0,"Overlapping army units");
 for(const p of host.match.players){
  const token=host.credentialsFor(p.id).token,view=host.view(token);
  assert(view.state.players.find(q=>q.id===p.id).units.length>=24,"Missing owned army");
  assert(view.state.players.filter(q=>q.id!==p.id).every(q=>q.resources===undefined),
    "Opponent resources leaked");
 }
 return {seed,players:8,formationOrders:formed,formationUnits:formed*24,
  liveUnits:host.match.players.reduce((n,p)=>n+p.units.filter(u=>u.alive).length,0),
  ticks,overlaps:overlaps.length,version:host.version,
  matchChecksum:checksum(host.match),scope:"local in-process simulation"};
}
