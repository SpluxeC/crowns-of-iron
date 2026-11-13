import {readFileSync} from "node:fs";
import {createMatch,step,checksum} from "../src/simulation.js";
import {makeMap} from "../src/map.js";
import {attachBattlefield} from "../src/battlefield.js";
import {installFullCatalog} from "../src/fullCatalog.js";
import {setEconomyMode} from "../src/spatialEconomy.js";
import {enableBot,botSummary} from "../src/ai.js";
import {executableCoverage} from "../src/technologyEffects.js";

const data=JSON.parse(readFileSync("data/balance-v0.2.json","utf8"));
const match=createMatch([{id:"human",faction:"Humans"},{id:"ursa",faction:"Ursa"}],20261112);
installFullCatalog(match,data);
attachBattlefield(match,makeMap({seed:20261112,players:2}));
setEconomyMode(match,"spatial");
enableBot(match,"ursa","Hard");
for(let t=0;t<60;t++)step(match,1000);
const coverage=executableCoverage(Object.keys(match.fullCatalog.techs.Humans));
const bots=botSummary(match);
const jobs=Object.values(match.harvestJobs??{}).filter(job=>job.owner==="ursa");
if(coverage.implemented!==70||coverage.pending!==8||bots.ursa.decisions<1||jobs.length<1)
 throw new Error("Milestone 2.7–3.0 integration failed");
console.log(JSON.stringify({
 milestone:"2.7–3.0 headless validation",
 optionalResearchImplemented:coverage.implemented,
 optionalResearchPending:coverage.pending,
 buildingDataEntries:Object.values(match.fullCatalog.buildings).reduce((n,types)=>n+Object.keys(types).length,0),
 botDecisions:bots.ursa.decisions,activeHarvesters:jobs.length,
 elapsedSeconds:match.elapsedMs/1000,checksum:checksum(match),
 caveat:"This exercises prototypes, not 3D, production multiplayer, or the remaining research effects"
},null,2));
