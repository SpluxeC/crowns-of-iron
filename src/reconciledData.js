import {readFileSync} from "node:fs";
import {FACTIONS,mandatory} from "./constants.js";
import {assert} from "./util.js";
const EXPECTED={land:132,naval:48,air:36,buildings:228,research:540,upgrades:126};
export function loadReconciled(path="data/balance-v0.2.json"){
 const data=JSON.parse(readFileSync(path,"utf8"));
 for(const [key,count] of Object.entries(EXPECTED)){
   assert(data[key]?.rows?.length===count,"Missing/incomplete balance tab: "+key);
 }
 for(const faction of FACTIONS){
   for(const [key,count] of [["land",22],["naval",8],["air",6],["research",90]])
     assert(data[key].rows.filter(r=>r[0]===faction).length===count,"Roster mismatch: "+faction+" "+key);
 }
 return data;
}
export function factionRoster(data,faction){
 assert(FACTIONS.includes(faction),"Unknown faction");
 const categories=["land","naval","air"];
 return categories.flatMap(domain=>data[domain].rows.filter(r=>r[0]===faction).map(row=>{
   const [owner,age,role,name,hp,attack,interval,armor,range,speed,pop,food,wood,stone,metal,gold,aether,seconds,type,targets]=row;
   return {domain,faction:owner,age,role,name,hp,attack,interval,armor,range,speed,pop,
     cost:{Food:food,Wood:wood,Stone:stone,Metal:metal,Gold:gold,Aether:aether},
     ms:Math.round(seconds*1000),type,targets};
 }));
}
export function technologyCatalog(data,faction){
 assert(FACTIONS.includes(faction),"Unknown faction");
 const result=new Map();
 for(const row of data.research.rows.filter(r=>r[0]===faction)){
   const [owner,id,name,category,age,food,wood,stone,metal,gold,aether,seconds,pre,locations,exclusive,status,effect]=row;
   const def={id,name,age,category,cost:{Food:food,Wood:wood,Stone:stone,Metal:metal,Gold:gold,Aether:aether},
     ms:Math.round(seconds*1000),requires:pre?[pre]:[],locations:locations.split(";"),exclusive,effect};
   result.set(id,def);
 }
 assert(result.size===90,"Technology IDs must be unique");
 for(const base of mandatory)assert(result.has(base.id),"Missing mandatory "+base.id);
 return result;
}
