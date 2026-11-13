import {createMatch,step,checksum} from "../src/simulation.js";
import {attachBattlefield} from "../src/battlefield.js";
import {makeMap,at} from "../src/map.js";
import {setEconomyMode,assignHarvestJob} from "../src/spatialEconomy.js";
const match=createMatch([{id:"a",faction:"Humans"},{id:"b",faction:"Orcs"}],37);
attachBattlefield(match,makeMap({seed:37,players:2}));
setEconomyMode(match,"spatial");
const start=match.battlefield.starts[0],tile=at(match.battlefield,start.x+3,start.y);
const worker=match.players[0].units[0],before=match.players[0].resources.Food;
assignHarvestJob(match,"a",worker.id,tile.x,tile.y);
for(let i=0;i<45;i++)step(match,1000);
const after=match.players[0].resources.Food;
console.log(JSON.stringify({mode:"spatial",elapsedSeconds:45,
 deliveredFood:after-before,remainingDeposit:tile.amount,
 workerCargo:worker.cargo?.amount??0,checksum:checksum(match)},null,2));
if(after<=before)throw new Error("Spatial economy failed to deliver harvested resources");
