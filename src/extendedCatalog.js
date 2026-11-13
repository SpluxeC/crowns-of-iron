import {ARCHETYPES} from "./catalog.js";
const def=(age,hp,attack,armor,pop,cost,ms,category="Mechanical",type="Pierce",extra={})=>({age,hp,attack,armor,pop,cost,ms,category,type,...extra});
export const NAVAL=Object.freeze({
  Raft:def("I",170,0,0,1,{Wood:90},35000,"Mechanical","Pierce",{passengerPop:4}),
  "Fishing Vessel":def("II",190,0,2,1,{Wood:90,Gold:30},38000),
  "Trade Ship":def("II",260,0,3,2,{Wood:140,Metal:30,Gold:70},50000),
  "Transport Ship":def("II",450,0,5,3,{Wood:170,Metal:50,Gold:80},60000,"Mechanical","Pierce",{passengerPop:16}),
  "Light Warship":def("II",420,26,8,3,{Wood:180,Metal:70,Gold:100},50000),
  "Heavy Warship":def("III",900,55,16,6,{Wood:260,Stone:100,Metal:200,Gold:160},75000,"Mechanical","Crush"),
  "Naval Siege Ship":def("IV",780,125,13,7,{Wood:210,Stone:160,Metal:260,Gold:220},95000,"Mechanical","Crush"),
  "Legendary Warship":ARCHETYPES["Legendary Warship"]
});
export const AIR=Object.freeze({
  "Scout Aircraft":def("IV",120,0,2,2,{Wood:70,Metal:130,Gold:100},50000,"Air"),
  Interceptor:def("V",230,32,7,3,{Metal:180,Gold:120,Aether:30},55000,"Air"),
  Gunship:def("V",420,44,10,4,{Metal:240,Gold:160,Aether:40},70000,"Air"),
  Bomber:def("V",390,125,9,5,{Metal:260,Gold:190,Aether:50},80000,"Air","Fire"),
  "Air Transport":def("V",350,0,9,4,{Wood:80,Metal:220,Gold:140,Aether:35},75000,"Air","Pierce",{passengerPop:12}),
  "Aerial Battleship":def("V",1150,105,23,10,{Metal:600,Gold:380,Aether:100},130000,"Air","Arcane")
});
export const ALL_ARCHETYPES=Object.freeze({...ARCHETYPES,...NAVAL,...AIR});
export function validateRoster(){
  const land=Object.keys(ARCHETYPES).filter(k=>k!=="Legendary Warship");
  if(land.length!==22||Object.keys(NAVAL).length!==8||Object.keys(AIR).length!==6)throw new Error("Role count mismatch");
  for(const [name,d] of Object.entries(ALL_ARCHETYPES)){
    if(!d.age||!Number.isInteger(d.hp)||!Number.isInteger(d.pop)||d.pop<1||d.hp<1)throw new Error("Invalid archetype: "+name);
  }
  return {land:land.length,naval:Object.keys(NAVAL).length,air:Object.keys(AIR).length,perFaction:36,total:216};
}
