import {createMatch,getPlayer,setWorkerAllocation,setPopCap,addFacility} from "./state.js";
import {gather,addIncome} from "./economy.js";
import {queueResearch,tickResearch,cancelResearch} from "./research.js";
import {queueUnit,tickProduction,cancelUnit} from "./production.js";
import {strike,heal,repair,tickStatuses} from "./combat.js";
import {assert,clone,hash} from "./util.js";
import {tickBots} from "./ai.js";
import {tickMode} from "./modes.js";
import {issueMove,issueAttack,tickBattlefield} from "./battlefield.js";
import {startConstruction,cancelConstruction,tickConstruction} from "./construction.js";
import {useHeroAbility} from "./abilities.js";
import {unitDefinition,researchCatalog} from "./fullCatalog.js";
import {harvestDeposit} from "./harvesting.js";
import {assignHarvestJob,cancelHarvestJob,deliverCargo,tickSpatialHarvest} from "./spatialEconomy.js";
import {destroyToRuin,salvageRuin,rebuildRuin,tickRuins} from "./ruins.js";
import {queueBuildingUpgrade,cancelBuildingUpgrade,tickBuildingUpgrades} from "./buildingUpgrades.js";
import {orderStructureAttack,tickStructureCombat,repairBuilding} from "./structureCombat.js";
import {setGateOpen} from "./gates.js";
import {refreshStructureTechnology} from "./technologyEffects.js";
import {garrisonUnit,ungarrisonUnit,tickFortificationFire} from "./fortifications.js";
import {tickRenewables} from "./renewableEconomy.js";
export {createMatch};
export function command(match,input,{allowDebug=false}={}){
  assert(match.winner===null,"Match already finished");
  const {player:id,action}=input;
  if(["income","popCap","facility"].includes(action))assert(allowDebug,"Developer-only action");
  const player=getPlayer(match,id);
  assert(player.alive&&!player.defeated,"Player eliminated");
  let result;
  switch(action){
    case "allocate":result=setWorkerAllocation(player,input.workers);break;
    case "popCap":result=setPopCap(player,input.cap);break;
    case "facility":result=addFacility(player,input.name);break;
    case "income":result=addIncome(player,input.amount);break; // harness only, disallow on public network server
    case "research":result=queueResearch(player,input.facility,input.id,researchCatalog(match,player));break;
    case "cancelResearch":result=cancelResearch(player,input.facility,input.id);break;
    case "train":result=queueUnit(player,input.facility,input.role,unitDefinition(match,player,input.role));break;
    case "cancelTrain":result=cancelUnit(player,input.facility,input.index);break;
    case "attack":result=match.battlefield
      ? issueAttack(match,id,input.attacker,input.targetPlayer,input.target)
      : strike(player,getPlayer(match,input.targetPlayer),input.attacker,input.target,{nowMs:match.elapsedMs});break;
    case "move":result=issueMove(match,id,input.unitId,input.x,input.y);break;
    case "build":result=startConstruction(match,id,input.kind,input.x,input.y,input.workers);break;
    case "cancelBuild":result=cancelConstruction(match,id,input.siteId);break;
    case "harvest":result=harvestDeposit(match,id,input.workerId,input.x,input.y);break;
    case "assignHarvest":result=assignHarvestJob(match,id,input.workerId,input.x,input.y);break;
    case "cancelHarvest":result=cancelHarvestJob(match,id,input.workerId);break;
    case "deliverCargo":result=deliverCargo(match,id,input.workerId);break;
    case "salvage":result=salvageRuin(match,id,input.siteId);break;
    case "rebuild":result=rebuildRuin(match,id,input.siteId,input.workers);break;
    case "upgrade":result=queueBuildingUpgrade(match,id,input.siteId,input.name);break;
    case "cancelUpgrade":result=cancelBuildingUpgrade(match,id,input.siteId,input.name);break;
    case "attackStructure":result=orderStructureAttack(match,id,input.unitId,input.siteId);break;
    case "repairBuilding":result=repairBuilding(match,id,input.siteId,input.workers,input.amount);break;
    case "gate":result=setGateOpen(match,id,input.siteId,input.open);break;
    case "garrison":result=garrisonUnit(match,id,input.siteId,input.unitId);break;
    case "ungarrison":result=ungarrisonUnit(match,id,input.unitId);break;
    case "ability":result=useHeroAbility(match,id,input.heroId,input.point);break;
    case "heal":result=heal(player,input.healers,input.target,match.elapsedMs);break;
    case "repair":result=repair(player,input.workers,input.target,input.amount,match.elapsedMs);break;
    default:throw new Error("Unknown action: "+action);
  }
  match.commands.push(clone(input));return result;
}
export function debugCommand(match,input){return command(match,input,{allowDebug:true});}
export function checkElimination(match,deltaMs){
  for(const p of match.players){
    if(p.defeated)continue;
    const hasTc=(p.facilities["Town Center"]??0)>0;
    const hasWorker=p.units.some(u=>u.alive&&u.archetype==="Worker");
    const hasCombat=p.units.some(u=>u.alive&&u.archetype!=="Worker");
    if(hasTc||hasWorker){p.lastStandMs=null;continue;}
    if(!hasCombat){p.alive=false;p.defeated=true;p.lastStandMs=0;continue;}
    p.lastStandMs=(p.lastStandMs??300000)-deltaMs;
    if(p.lastStandMs<=0){p.alive=false;p.defeated=true;p.lastStandMs=0;}
  }
  const teams=new Set(match.players.filter(p=>!p.defeated).map(p=>p.team));
  if(match.mode==="Conquest"&&teams.size===1)match.winner=[...teams][0];
}
function substep(match,ms,opts){
  tickBots(match,ms);
  for(const player of match.players.filter(x=>!x.defeated)){
    if(match.economyMode!=="spatial")gather(player,ms,opts.economy?.[player.id]??{});
    const before=player.completed.length;
    tickResearch(player,ms,researchCatalog(match,player));
    if(player.completed.length!==before)refreshStructureTechnology(match,player);
    tickProduction(match,player,ms);
    tickStatuses(player,ms);
  }
  tickConstruction(match,ms);
  tickBuildingUpgrades(match,ms);
  tickRenewables(match,ms);
  tickSpatialHarvest(match);
  tickBattlefield(match,ms);
  tickFortificationFire(match);
  tickStructureCombat(match);
  checkElimination(match,ms);
  tickMode(match,ms);
  match.elapsedMs+=ms;match.tick++;
  tickRuins(match);
}
export function step(match,deltaMs,opts={}){
  assert(Number.isSafeInteger(deltaMs)&&deltaMs>0&&deltaMs<=60000,"Tick must be 1–60000 ms");
  // Fixed one-second simulation slices. Advancing 60 seconds in one call
  // is equivalent to sixty calls of one second (when commands are unchanged).
  let remaining=deltaMs;
  while(remaining>0&&match.winner===null){
    const slice=Math.min(1000,remaining);
    substep(match,slice,opts);
    remaining-=slice;
  }
  return match;
}
export function snapshot(match){return clone(match);}
export function checksum(match){return hash(snapshot(match));}
export function replay(participants,seed,events){
  const match=createMatch(participants,seed);
  for(const item of events){if(item.kind==="step")step(match,item.ms,item.options??{});else command(match,item);}
  return match;
}
