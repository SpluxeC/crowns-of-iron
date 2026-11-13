import {readFileSync} from "node:fs";
import {createMatch,command,step,checksum} from "../src/simulation.js";
import {installFullCatalog} from "../src/fullCatalog.js";
import {makeMap,placeBuilding} from "../src/map.js";
import {attachBattlefield} from "../src/battlefield.js";
import {makeUnit} from "../src/state.js";
import {ARCHETYPES} from "../src/catalog.js";
import {executableCoverage} from "../src/technologyEffects.js";
import {MatchHost} from "../src/network.js";
const participants=[{id:"humans",faction:"Humans"},{id:"orcs",faction:"Orcs"}];
const data=JSON.parse(readFileSync("data/balance-v0.2.json","utf8"));
const match=createMatch(participants,110);
installFullCatalog(match,data);
const coverage=executableCoverage(Object.keys(match.fullCatalog.techs.Humans));
if(coverage.implemented!==78||coverage.pending!==0)throw Error("Unimplemented optional technology effect");
const map=makeMap({seed:110,players:2});
for(const t of map.tiles){t.terrain="grass";t.occupied=null;t.resource=null;t.amount=0;}
attachBattlefield(match,map);
const loc=placeBuilding(map,{owner:"orcs",kind:"Stone Gatehouse",x:12,y:10,width:2,height:2});
match.constructions={[loc.id]:{siteId:loc.id,owner:"orcs",kind:"Stone Gatehouse",
 completed:true,hp:1500,maxHp:1500,armor:10,garrisonIds:[]}};
const player=match.players[0];
const tower=makeUnit(player,"Siege Tower",ARCHETYPES["Siege Tower"],"tower-demo");
tower.x=11;tower.y=10;player.units.push(tower);player.popUsed+=tower.pop;
const passenger=makeUnit(player,"Swordsman",ARCHETYPES.Swordsman,"passenger-demo");
passenger.x=10;passenger.y=10;player.units.push(passenger);player.popUsed+=passenger.pop;
const boarded=command(match,{player:"humans",action:"embark",carrierId:tower.id,passengerId:passenger.id});
command(match,{player:"humans",action:"deployRamp",towerId:tower.id,siteId:loc.id});
step(match,6000);
if(boarded.occupied!==1||passenger.embarkedAt!==tower.id||match.elapsedMs<tower.rampReadyAtMs)
 throw Error("Siege ramp or transported infantry invariant failed");
const host=new MatchHost(participants,110);
const token=host.credentialsFor("humans").token;
const batch=host.submitBatch({token,expectedVersion:0,orders:[
 {sequence:1,action:"allocate",payload:{workers:{Food:2,Wood:1}}},
 {sequence:2,action:"train",payload:{facility:"Town Center",role:"Worker"}}
]});
if(batch.version!==2||batch.commands!==2)throw Error("Atomic batch did not complete");
console.log(JSON.stringify({milestone:"3.9–4.2",implementedOptionalTechnologies:coverage.implemented,
 pendingOptionalTechnologies:coverage.pending,siegeRampReady:true,
 boardedInfantryPopulation:boarded.occupied,
 localBatchActions:batch.commands,localStateVersion:batch.version,
 checksum:checksum(match),
 caveat:"Headless rules and local protocol only; no live production matchmaking or 3D client"},null,2));
