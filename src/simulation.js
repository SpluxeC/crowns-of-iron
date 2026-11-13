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
import {setGateOpen,tickGateMechanisms} from "./gates.js";
import {startConversion,tickConversions,surveyAether,aetherPulse} from "./arcaneResearch.js";
import {disruptFortification} from "./siegeDisruption.js";
import {refreshStructureTechnology} from "./technologyEffects.js";
import {garrisonUnit,ungarrisonUnit,tickFortificationFire} from "./fortifications.js";
import {tickRenewables} from "./renewableEconomy.js";
import {staffedHospitalHeal,staffedVehicleRepair} from "./localBuildingEffects.js";
import {orderFormation,orderSiege} from "./formationOrders.js";
import {assignSeaTrade,cancelSeaTrade,tickNavalEconomy} from "./navalEconomy.js";
import {embark,disembark,transportLosses} from "./transports.js";
import {deploySiegeRamp,assaultBattlement,resetInvalidRamps} from "./siegeTowers.js";
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
    case "stop":{
      assert(typeof input.unitId==="string","Invalid stop unit");
      const own=player.units.find(u=>u.id===input.unitId&&u.alive);
      assert(own,"Unit not owned or alive");
      const previous=match.orders?.[own.id]??null;
      if(match.orders)delete match.orders[own.id];
      result={unitId:own.id,stopped:!!previous};
      break;
    }
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
    case "gate":result=setGateOpen(match,id,input.siteId,input.open,input.autoClose??false,input.timed??false);break;
    case "hospitalHeal":result=staffedHospitalHeal(match,id,input.siteId,input.healers,input.targetId);break;
    case "vehicleRepair":result=staffedVehicleRepair(match,id,input.siteId,input.workers,input.targetId,input.amount);break;
    case "convert":result=startConversion(match,id,input.converterId,input.targetPlayer,input.targetId);break;
    case "surveyAether":result=surveyAether(match,id,input.workerId);break;
    case "aetherPulse":result=aetherPulse(match,id,input.workerId,input.x,input.y);break;
    case "disrupt":result=disruptFortification(match,id,input.unitId,input.siteId);break;
    case "formation":result=orderFormation(match,id,input.units,input.x,input.y);break;
    case "siege":result=orderSiege(match,id,input.unitId,input.siteId);break;
    case "seaTrade":result=assignSeaTrade(match,id,input.vesselId,input.fromSite,input.toSite);break;
    case "cancelSeaTrade":result=cancelSeaTrade(match,id,input.vesselId);break;
    case "embark":result=embark(match,id,input.carrierId,input.passengerId);break;
    case "disembark":result=disembark(match,id,input.carrierId,input.passengers);break;
    case "deployRamp":result=deploySiegeRamp(match,id,input.towerId,input.siteId);break;
    case "assaultBattlement":result=assaultBattlement(match,id,input.towerId,input.attackerId,input.targetId);break;
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
  tickNavalEconomy(match,ms);
  tickFortificationFire(match);
  tickStructureCombat(match);
  tickConversions(match);
  tickGateMechanisms(match);
  transportLosses(match);
  resetInvalidRamps(match);
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
