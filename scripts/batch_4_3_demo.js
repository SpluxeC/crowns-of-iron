import {readFileSync} from "node:fs";
import {createMatch,step,checksum} from "../src/simulation.js";
import {installFullCatalog} from "../src/fullCatalog.js";
import {makeMap} from "../src/map.js";
import {attachBattlefield} from "../src/battlefield.js";
import {upgradeCoverage} from "../src/buildingUpgrades.js";
import {enableUnitCollision,validateCollisionState} from "../src/unitCollision.js";
import {runLocalHostStress} from "../src/networkDiagnostics.js";
const players=[{id:"a",faction:"Humans"},{id:"b",faction:"Orcs"}];
const match=createMatch(players,20261113);
const data=JSON.parse(readFileSync("data/balance-v0.2.json","utf8"));
installFullCatalog(match,data);
const map=makeMap({seed:20261113,players:2,width:40,height:32});
attachBattlefield(match,map);
enableUnitCollision(match);
const coverage=upgradeCoverage(match);
if(coverage.catalog!==126||coverage.executable!==126||coverage.pending!==0)
 throw Error("Building upgrade effect coverage incomplete");
const overlaps=validateCollisionState(match).overlaps;
if(overlaps.length)throw Error("Collision-enabled starting units still overlap");
step(match,1000);
const stress=runLocalHostStress({seed:20261113,players:8,population:300,ticks:2});
console.log(JSON.stringify({
 milestone:"4.3–4.6",
 executableLocalUpgradeRecords:coverage.executable,
 remainingLocalUpgradeRecords:coverage.pending,
 optInCollision:true,
 collisionOverlaps:overlaps.length,
 eightPlayerLocalStressUnits:stress.totalUnits,
 localStressTicks:stress.ticks,
 localStressVersion:stress.serverVersion,
 browserProjection:"Interactive selectable isometric 2.5D preview; not a 3D renderer",
 checksum:checksum(match)
},null,2));
