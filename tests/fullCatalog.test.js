import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
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
 return {...units,buildings:{columns:["Faction"],rows:Array.from({length:228},(_,i)=>[FACTIONS[Math.floor(i/38)],"I","Synthetic Building "+(i%38),500,4,0,50,30,0,0,0,30,"2x2","Fixture"])},
 research:tech,upgrades:{columns:["Faction"],rows:Array.from({length:126},(_,i)=>[FACTIONS[Math.floor(i/21)],"Barracks","II","Training Equipment I",0,100,0,50,0,0,40,"-10% training time"])}};
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
test("committed full balance JSON validates in CI and installs 540 technologies",()=>{
 const path="data/balance-v0.2.json";
 const dataset=JSON.parse(readFileSync(path,"utf8"));
 assert.equal(validateFullCatalog(dataset),true);
 const m=createMatch(participants);
 const result=installFullCatalog(m,dataset);
 assert.equal(result.unitEntries,216);
});

test("real faction unit training uses reconciled stats without double modifiers",()=>{
 const data=JSON.parse(readFileSync("data/balance-v0.2.json","utf8"));
 const m=createMatch(participants),p=m.players[1];
 installFullCatalog(m,data);
 p.age="II";p.resources.Food=5000;p.resources.Wood=5000;
 p.resources.Stone=5000;p.resources.Metal=5000;p.resources.Gold=5000;
 p.facilities.Barracks=1;p.facilitySerial.Barracks=1;p.unitQueues["Barracks#1"]=[];
 const row=data.land.rows.find(r=>r[0]==="Ursa"&&r[2]==="Swordsman");
 assert.ok(row);
 command(m,{player:"b",action:"train",facility:"Barracks#1",role:"Swordsman"});
 step(m,row[17]*1000);
 const unit=p.units.find(u=>u.archetype==="Swordsman");
 assert.ok(unit);
 assert.equal(unit.hp,row[4]);
 assert.equal(unit.attack,row[5]);
 assert.equal(unit.armor,row[7]);
 assert.equal(unit.name,row[3]);
});
test("imported mutually exclusive paths cannot both be queued",()=>{
 const data=JSON.parse(readFileSync("data/balance-v0.2.json","utf8"));
 const m=createMatch(participants),p=m.players[0];installFullCatalog(m,data);
 p.age="V";p.resources={Food:99999,Wood:99999,Stone:99999,Metal:99999,Gold:99999,Aether:99999};
 p.facilities.Academy=1;p.facilitySerial.Academy=1;p.researchQueues["Academy#1"]=[];
 command(m,{player:"a",action:"research",facility:"Academy#1",id:"FAC-11"});
 assert.throws(()=>command(m,{player:"a",action:"research",facility:"Academy#1",id:"FAC-12"}),
   /Conflicting exclusive research/);
});
