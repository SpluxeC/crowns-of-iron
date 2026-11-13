import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync,existsSync} from "node:fs";
import {createMatch,command,step} from "../src/simulation.js";
import {installFullCatalog,validateFullCatalog} from "../src/fullCatalog.js";
import {FACTIONS,mandatory} from "../src/constants.js";
const participants=[{id:"a",faction:"Humans"},{id:"b",faction:"Ursa"}];
function synthetic(){
 const age=["I","II","III","IV","V"],roles=[
 "Worker","Scout","Club Fighter","Stone Slinger","Stone Spearman","Swordsman","Archer","Pikeman","Raider",
 "Heavy Infantry","Heavy Mobile","Battering Ram","Siege Tower","Healer","Converter","Hero","Gunner","Heavy Artillery",
 "Anti-Air Infantry","Mechanized Infantry","Heavy War Machine","Legendary Land","Raft","Fishing Vessel","Trade Ship",
 "Transport Ship","Light Warship","Heavy Warship","Naval Siege Ship","Legendary Warship","Scout Aircraft",
 "Interceptor","Gunship","Bomber","Air Transport","Aerial Battleship"
 ];
 const units=Object.fromEntries(["land","naval","air"].map(k=>[k,{columns:["Faction","Age","Role"],rows:[]}]));
 const tech={columns:["Faction","Tech ID"],rows:[]};
 for(const f of FACTIONS){
   for(let i=0;i<36;i++){
     const role=roles[i],domain=i<22?"land":i<30?"naval":"air";
     const minAge=i<5?"I":i<9?"II":i<16?"III":i<19?"IV":"V";
     units[domain].rows.push([f,minAge,role,role+" "+f,100,12,2,4,6,3,1,
       100,20,0,0,0,0,30,"Slash","Ground"]);
   }
   for(let i=0;i<90;i++){
     const mandatoryTech=mandatory[i];
     const id=mandatoryTech?.id??("OPT-"+String(i+1).padStart(2,"0"));
     const phase=mandatoryTech?.age??"II";
     tech.rows.push([f,id,id,"Economy",phase,50,0,0,0,0,0,10,"","Town Center",
       i>=88?"Exclusive Path":null,null,"+5%"]);
   }
 }
 return {...units,buildings:{columns:["Faction"],rows:Array(228).fill(["Humans"])},
 research:tech,upgrades:{columns:["Faction"],rows:Array(126).fill(["Humans"])}};
}
test("install complete 216-unit and 540-tech synthetic catalog and exercise queue",()=>{
 const m=createMatch(participants),dataset=synthetic();
 assert.equal(validateFullCatalog(dataset),true);
 assert.deepEqual(installFullCatalog(m,dataset),{factions:6,unitEntries:216,techEntries:540});
 assert.equal(m.fullCatalog.units.Humans.Worker.hp,100);
 assert.equal(Object.keys(m.fullCatalog.techs.Ursa).length,90);
 command(m,{player:"a",action:"research",facility:"Town Center",id:"CIV-01"});
 step(m,10000);assert.ok(m.players[0].completed.includes("CIV-01"));
 assert.throws(()=>installFullCatalog(m,dataset),/before simulation/);
});
test("full catalog rejects duplicate tech and missing fallback",()=>{
 const d=synthetic();d.research.rows[1][1]=d.research.rows[0][1];
 assert.throws(()=>validateFullCatalog(d),/Duplicate tech/);
});
test("genuine workbook JSON passes schema validation when supplied",()=>{
 const path="data/balance-v0.2.json";
 if(!existsSync(path))return;
 const dataset=JSON.parse(readFileSync(path,"utf8"));
 assert.equal(validateFullCatalog(dataset),true);
 const m=createMatch(participants);
 const result=installFullCatalog(m,dataset);
 assert.equal(result.unitEntries,216);
});
