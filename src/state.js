import {FACTIONS,STARTING,POP_CAP} from "./constants.js";
import {assert,clone} from "./util.js";
import {ARCHETYPES,displayName} from "./catalog.js";
export function createPlayer(id,faction,team=id){
  assert(FACTIONS.includes(faction),"Unknown faction");
  const player={
    id,faction,team,age:"I",resources:clone(STARTING),popUsed:4,popCap:20,
    alive:true,lastStandMs:null,defeated:false,
    workers:{Food:3,Wood:0,Stone:0,Metal:0,Gold:0,Aether:0},workerIncomeRemainder:{},workerUpkeepRemainder:{Gold:0,Food:0},
    completed:[],researchQueues:{"Town Center":[]},unitQueues:{"Town Center":[]},
    facilities:{"Town Center":1},units:[],history:[]
  };
  const worker=ARCHETYPES.Worker,scout=ARCHETYPES.Scout;
  for(let i=0;i<3;i++)player.units.push(makeUnit(player,"Worker",worker,id+"-start-worker-"+i));
  player.units.push(makeUnit(player,"Scout",scout,id+"-start-scout"));
  return player;
}
export function makeUnit(player,archetype,definition,id){
  return {id,owner:player.id,faction:player.faction,archetype,name:displayName(player.faction,archetype),
    hp:definition.hp,maxHp:definition.hp,armor:definition.armor,pop:definition.pop,
    attack:definition.attack??0,category:definition.category??"Standard",type:definition.type??"Slash",
    cost:clone(definition.cost??{}),alive:true,status:[],nextAttackAtMs:0};
}
export function createMatch(participants,seed=1){
  assert(Array.isArray(participants)&&participants.length>=2&&participants.length<=8,"Requires 2–8 players");
  const ids=new Set();
  const players=participants.map((p,i)=>{const id=p.id??"p"+(i+1);assert(!ids.has(id),"Duplicate player ID");ids.add(id);return createPlayer(id,p.faction,p.team??id);});
  return {seed,elapsedMs:0,tick:0,idCounter:0,players,commands:[],winner:null,mode:"Conquest"};
}
export function getPlayer(match,id){const p=match.players.find(p=>p.id===id);assert(p,"Unknown player");return p;}
export function nextId(match,prefix="u"){match.idCounter++;return prefix+"-"+match.idCounter;}
export function addFacility(player,name){
  assert(player.alive&&!player.defeated,"Player eliminated");
  player.facilities[name]=(player.facilities[name]??0)+1;
  const key=name+"#"+player.facilities[name];
  if(!player.researchQueues[key])player.researchQueues[key]=[];
  if(!player.unitQueues[key])player.unitQueues[key]=[];
  return key;
}
export function setWorkerAllocation(player,assignment){
  let total=0;
  for(const [k,v] of Object.entries(assignment)){
    assert(["Food","Wood","Stone","Metal","Gold","Aether"].includes(k),"Unknown resource");
    assert(Number.isSafeInteger(v)&&v>=0,"Invalid workers");
    total+=v;
  }
  const aliveWorkers=player.units.filter(u=>u.alive&&u.archetype==="Worker").length;
  assert(total<=aliveWorkers,"Not enough workers");
  player.workers=Object.fromEntries(["Food","Wood","Stone","Metal","Gold","Aether"].map(k=>[k,assignment[k]??0]));
}
export function killUnit(player,id){
  const u=player.units.find(x=>x.id===id);assert(u&&u.alive,"Unit not alive");
  u.hp=0;u.alive=false;player.popUsed-=u.pop;assert(player.popUsed>=0,"Negative population");
  // worker allocations must never exceed surviving workers
  const aliveWorkers=player.units.filter(x=>x.alive&&x.archetype==="Worker").length;
  const order=["Aether","Gold","Metal","Stone","Wood","Food"];
  let extra=Object.values(player.workers).reduce((a,b)=>a+b,0)-aliveWorkers;
  for(const k of order)if(extra>0){const n=Math.min(extra,player.workers[k]);player.workers[k]-=n;extra-=n;}
  return u;
}
export function setPopCap(player,cap){assert(Number.isSafeInteger(cap)&&cap>=0&&cap<=POP_CAP,"Invalid population cap");player.popCap=cap;}
