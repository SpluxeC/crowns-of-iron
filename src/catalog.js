import {HERO,LEGENDARY_LAND,LEGENDARY_SHIP,SIEGE_TOWER,FACTIONS} from "./constants.js";
import {canonicalName} from "./factionRoster.js";
export const ARCHETYPES = Object.freeze({
  Worker:{age:"I",hp:65,attack:4,armor:0,pop:1,cost:{Food:50},ms:15000,category:"Light",type:"Slash"},
  Scout:{age:"I",hp:85,attack:6,armor:1,pop:1,cost:{Food:55},ms:18000,category:"Light",type:"Slash"},
  "Club Fighter":{age:"I",hp:100,attack:10,armor:2,pop:1,cost:{Food:55,Wood:10},ms:18000,category:"Standard",type:"Slash"},
  "Stone Slinger":{age:"I",hp:65,attack:8,armor:0,pop:1,cost:{Food:55,Wood:25},ms:20000,category:"Light",type:"Pierce"},
  "Stone Spearman":{age:"I",hp:90,attack:9,armor:2,pop:1,cost:{Food:55,Wood:15},ms:20000,category:"Standard",type:"Pierce"},
  Swordsman:{age:"II",hp:120,attack:15,armor:5,pop:1,cost:{Food:75,Wood:15,Metal:15},ms:25000,category:"Standard",type:"Slash"},
  Archer:{age:"II",hp:80,attack:13,armor:1,pop:1,cost:{Food:70,Wood:30,Gold:15},ms:27000,category:"Light",type:"Pierce"},
  Pikeman:{age:"II",hp:125,attack:14,armor:5,pop:1,cost:{Food:70,Wood:25,Metal:10},ms:27000,category:"Standard",type:"Pierce"},
  Raider:{age:"II",hp:170,attack:19,armor:6,pop:2,cost:{Food:105,Wood:20,Metal:30,Gold:30},ms:36000,category:"Standard",type:"Slash"},
  "Heavy Infantry":{age:"III",hp:260,attack:28,armor:12,pop:2,cost:{Food:130,Metal:85,Gold:40},ms:42000,category:"Heavy",type:"Slash"},
  "Heavy Mobile":{age:"III",hp:320,attack:34,armor:11,pop:3,cost:{Food:150,Metal:100,Gold:60},ms:48000,category:"Heavy",type:"Crush"},
  "Battering Ram":{age:"III",hp:650,attack:70,armor:15,pop:4,cost:{Wood:150,Stone:50,Metal:100,Gold:40},ms:55000,category:"Mechanical",type:"Crush"},
  "Siege Tower":{age:"III",hp:600,attack:0,armor:12,pop:4,cost:{Wood:180,Metal:100,Gold:50},ms:55000,category:"Mechanical",type:"Crush",passengerPop:8},
  Healer:{age:"III",hp:100,attack:0,armor:1,pop:2,cost:{Food:65,Gold:75},ms:30000,category:"Light",type:"Arcane"},
  Converter:{age:"III",hp:110,attack:0,armor:2,pop:2,cost:{Food:75,Gold:100,Aether:20},ms:42000,category:"Light",type:"Arcane"},
  Hero:{age:"III",hp:850,attack:38,armor:15,pop:6,cost:{Food:300,Gold:300},ms:80000,category:"Heavy",type:"Slash",unique:"hero"},
  Gunner:{age:"IV",hp:140,attack:26,armor:5,pop:2,cost:{Food:90,Metal:85,Gold:40},ms:35000,category:"Standard",type:"Pierce"},
  "Heavy Artillery":{age:"IV",hp:420,attack:110,armor:10,pop:5,cost:{Wood:100,Stone:50,Metal:220,Gold:110},ms:75000,category:"Mechanical",type:"Crush"},
  "Anti-Air Infantry":{age:"IV",hp:125,attack:18,armor:4,pop:2,cost:{Food:90,Metal:65,Gold:45},ms:35000,category:"Standard",type:"Pierce"},
  "Mechanized Infantry":{age:"V",hp:320,attack:38,armor:16,pop:3,cost:{Metal:160,Gold:100,Aether:20},ms:48000,category:"Mechanical",type:"Pierce"},
  "Heavy War Machine":{age:"V",hp:950,attack:95,armor:25,pop:8,cost:{Stone:70,Metal:330,Gold:180,Aether:40},ms:95000,category:"Mechanical",type:"Crush"},
  "Legendary Land":{age:"V",hp:2400,attack:140,armor:35,pop:12,cost:{Stone:300,Metal:800,Gold:600,Aether:200},ms:160000,category:"Mechanical",type:"Crush",unique:"legendary-land"},
  "Legendary Warship":{age:"V",hp:2800,attack:165,armor:34,pop:12,cost:{Wood:300,Stone:400,Metal:850,Gold:700,Aether:220},ms:170000,category:"Mechanical",type:"Crush",unique:"legendary-ship"}
});
export function displayName(faction,archetype){
  const reconciled=canonicalName(faction,archetype);
  if(reconciled)return reconciled;
  if(archetype==="Hero")return HERO[faction];
  if(archetype==="Legendary Land")return LEGENDARY_LAND[faction];
  if(archetype==="Legendary Warship")return LEGENDARY_SHIP[faction];
  if(archetype==="Siege Tower")return SIEGE_TOWER[faction];
  return archetype;
}
export function validateCatalog(){
  for(const f of FACTIONS) {
    if(!HERO[f]||!LEGENDARY_LAND[f]||!LEGENDARY_SHIP[f]||!SIEGE_TOWER[f])throw new Error("Missing faction identity: "+f);
  }
  return true;
}
