import {validateCatalog} from "../src/catalog.js";
import {validateRoster} from "../src/extendedCatalog.js";
import {mandatory,FACTIONS,AGE_GATE} from "../src/constants.js";
import {createMatch,checksum} from "../src/simulation.js";
const roster=validateRoster();validateCatalog();
if(mandatory.length!==12)throw new Error("Must have 12 mandatory discoveries");
for(const [age,ids] of Object.entries(AGE_GATE)){
  if(ids.length!==3)throw new Error("Wrong age gate length: "+age);
  for(const id of ids){
    const tech=mandatory.find(t=>t.id===id);
    if(!tech||tech.age!==age||Object.keys(tech.cost).includes("Aether"))throw new Error("Mandatory age deadlock: "+id);
  }
}
const match=createMatch([{id:"a",faction:FACTIONS[0]},{id:"b",faction:FACTIONS[1]}]);
console.log(JSON.stringify({status:"ok",roster,mandatory:mandatory.length,seed:match.seed,initialChecksum:checksum(match)},null,2));
