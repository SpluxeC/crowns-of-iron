import {readFileSync} from "node:fs";
import {createMatch,step,checksum} from "../src/simulation.js";
import {makeCoastalMap,verifySeaConnectivity} from "../src/coastal.js";
import {attachBattlefield} from "../src/battlefield.js";
import {installFullCatalog} from "../src/fullCatalog.js";
import {setEconomyMode} from "../src/spatialEconomy.js";
import {enableBot} from "../src/ai.js";
import {setArmyStance} from "../src/armyAI.js";
import {executableCoverage} from "../src/technologyEffects.js";

const data=JSON.parse(readFileSync("data/balance-v0.2.json","utf8"));
const match=createMatch([{id:"human",faction:"Humans"},{id:"ursa",faction:"Ursa"}],20261113);
installFullCatalog(match,data);
const map=makeCoastalMap({width:64,height:64,seed:20261113,players:2});
const sea=verifySeaConnectivity(map);
if(!sea.connected)throw Error("Disconnected naval lane");
attachBattlefield(match,map);
setEconomyMode(match,"spatial");
enableBot(match,"ursa","Hard");
setArmyStance(match,"ursa","defend");
for(let i=0;i<60;i++)step(match,1000);
const coverage=executableCoverage(Object.keys(match.fullCatalog.techs.Humans));
const activeJobs=Object.values(match.harvestJobs??{}).filter(j=>j.owner==="ursa").length;
if(coverage.implemented!==70||coverage.pending!==8||activeJobs<1)
  throw Error("Milestone 3.1–3.4 demo invariant failed");
console.log(JSON.stringify({
  milestone:"3.1–3.4",coastal:true,
  sea:sea, coastalPads:map.coastalPads.length,
  implementedOptionalTechnologies:coverage.implemented,
  remainingOptionalTechnologies:coverage.pending,
  activeBotHarvestJobs:activeJobs,
  armyStance:match.bots.ursa.stance,
  ticks:match.tick,checksum:checksum(match),
  caveat:"Prototype only; not a complete 3D RTS or public multiplayer server"
},null,2));
