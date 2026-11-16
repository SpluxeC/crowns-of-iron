import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createMatch} from "../src/state.js";
import {attachBattlefield} from "../src/battlefield.js";
import {makeMap} from "../src/map.js";
import {installFullCatalog} from "../src/fullCatalog.js";
import {setEconomyMode} from "../src/spatialEconomy.js";
import {desiredBotBuilding} from "../src/botBasePlanner.js";
const data=JSON.parse(readFileSync(new URL("../data/balance-v0.2.json",import.meta.url)));
function fixture(age="III"){
 const m=createMatch([{id:"human",faction:"Humans"},{id:"ai-1",faction:"Orcs"}],319);
 attachBattlefield(m,makeMap({seed:319,width:48,height:48,players:2}));
 installFullCatalog(m,data);setEconomyMode(m,"spatial");
 const p=m.players[1];p.age=age;
 for(const r of Object.keys(p.resources))p.resources[r]=50000;
 p.popCap=100;
 return {m,p};
}
test("Age III expands its economy and then unlocks Academy-era building plans",()=>{
 const {m,p}=fixture("III");
 const first=desiredBotBuilding(m,p);
 assert.equal(first?.kind,"Training Camp");
 m.constructions={"test":{owner:p.id,kind:"Training Camp",completed:true}};
 assert.equal(desiredBotBuilding(m,p)?.kind,"Farm");
 m.constructions.farm={owner:p.id,kind:"Farm",completed:true};
 m.constructions.barracks={owner:p.id,kind:"Barracks",completed:true};
 m.constructions.range={owner:p.id,kind:"Archery Range",completed:true};
 m.constructions.forge={owner:p.id,kind:"Forge",completed:true};
 m.constructions.depot={owner:p.id,kind:"Resource Depot",completed:true};
 assert.equal(desiredBotBuilding(m,p)?.kind,"Academy");
});
test("Age IV and V plans contain distinct heavy production facilities",()=>{
 const {m,p}=fixture("V");
 const kinds=["Training Camp","Farm","Barracks","Archery Range","Forge","Resource Depot",
  "Academy","Siege Workshop","Field Hospital"];
 m.constructions=Object.fromEntries(kinds.map((kind,i)=>[
  "site"+i,{kind,owner:p.id,completed:true}]));
 assert.equal(desiredBotBuilding(m,p)?.kind,"Foundry");
 m.constructions.foundry={kind:"Foundry",owner:p.id,completed:true};
 m.constructions.air={kind:"Airship Hangar",owner:p.id,completed:true};
 assert.equal(desiredBotBuilding(m,p)?.kind,"Grand Factory");
});
