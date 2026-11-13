import {readFile} from "node:fs/promises";
import {MatchHost} from "../src/network.js";
import {installFullCatalog} from "../src/fullCatalog.js";
import {runArmyRehearsal} from "../src/armyRehearsal.js";
import {assert} from "../src/util.js";
const data=JSON.parse(await readFile(new URL("../data/balance-v0.2.json",import.meta.url),"utf8"));
const host=new MatchHost([{id:"human",faction:"Humans"},{id:"ursa",faction:"Ursa"}],607);
installFullCatalog(host.match,data);
const auth=host.credentialsFor("human").token,full=host.catalog(auth);
assert(full.research.length===90,"Expected one civilization's 90 research nodes");
assert(full.buildings.length>=38,"Expected full faction building catalog");
assert(full.training.some(t=>t.role==="Worker"),"Worker role absent");
const before=performance.now();
const result=runArmyRehearsal({seed:607,ticks:3});
assert(result.players===8&&result.formationUnits===192&&result.overlaps===0);
console.log(JSON.stringify({milestones:"5.9–6.2",revision:full.revision,
 faction:full.faction,researchOptions:full.research.length,
 buildingOptions:full.buildings.length,armyRehearsal:result,
 elapsedWallMs:Math.round(performance.now()-before),
 caveat:"In-process Node rehearsal only, no real browser GPU or Internet latency"},null,2));
