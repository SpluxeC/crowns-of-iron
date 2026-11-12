export const FACTIONS = Object.freeze(["Humans","Orcs","Dwarfs","Tree Elves","Corrupt Elves","Ursa"]);
export const RESOURCES = Object.freeze(["Food","Wood","Stone","Metal","Gold","Aether"]);
export const AGES = Object.freeze(["I","II","III","IV","V"]);
export const POP_CAP = 300;
export const STARTING = Object.freeze({ Food:250,Wood:200,Stone:100,Metal:0,Gold:0,Aether:0 });
export const CATEGORY = Object.freeze(["Light","Standard","Heavy","Mechanical","Organic","Timber","Masonry","ArmoredStructure"]);
export const DAMAGE_TYPES = Object.freeze(["Slash","Pierce","Crush","Fire","Arcane","Corruption"]);
export const COUNTERS = Object.freeze({
  Slash:[1,1,.75,.75,1,.75,.75,.75],
  Pierce:[1.25,1,.75,.75,1,.75,.75,.75],
  Crush:[1,1,1.25,1.25,1.25,1.5,1.5,1.25],
  Fire:[1,1,.75,1,1.25,1.5,.75,.75],
  Arcane:[1,1,1.25,1.25,1,1,1,1],
  Corruption:[1,1,1,.75,1.25,.75,.75,.75]
});
export const mandatory = Object.freeze([
  {id:"CIV-01",name:"Toolmaking",age:"I",cost:{Food:75},ms:20000},
  {id:"CIV-02",name:"Organized Gathering",age:"I",cost:{Food:75,Wood:25},ms:25000,requires:["CIV-01"]},
  {id:"CIV-03",name:"Permanent Settlements",age:"I",cost:{Food:100,Stone:50},ms:35000,requires:["CIV-02"]},
  {id:"CIV-04",name:"Metalworking",age:"II",cost:{Food:125,Wood:70},ms:55000},
  {id:"CIV-05",name:"Agriculture",age:"II",cost:{Food:160,Wood:90},ms:60000,requires:["CIV-04"]},
  {id:"CIV-06",name:"Organized Warfare",age:"II",cost:{Food:160,Stone:90,Metal:40},ms:65000,requires:["CIV-04"]},
  {id:"CIV-07",name:"Advanced Engineering",age:"III",cost:{Food:230,Wood:120,Stone:120,Metal:50},ms:90000},
  {id:"CIV-08",name:"Scholarly Institutions",age:"III",cost:{Food:200,Wood:120,Stone:100,Gold:100},ms:90000,requires:["CIV-07"]},
  {id:"CIV-09",name:"Complex Machinery",age:"III",cost:{Food:240,Stone:100,Metal:150,Gold:80},ms:100000,requires:["CIV-07"]},
  {id:"CIV-10",name:"Industrial Production",age:"IV",cost:{Food:280,Stone:130,Metal:210,Gold:120},ms:115000},
  {id:"CIV-11",name:"Steam Power",age:"IV",cost:{Food:240,Stone:150,Metal:250,Gold:130},ms:120000,requires:["CIV-10"]},
  {id:"CIV-12",name:"Experimental Aeronautics",age:"IV",cost:{Food:250,Wood:100,Metal:230,Gold:180},ms:125000,requires:["CIV-10"]}
]);
export const AGE_GATE = Object.freeze({
  I:["CIV-01","CIV-02","CIV-03"],
  II:["CIV-04","CIV-05","CIV-06"],
  III:["CIV-07","CIV-08","CIV-09"],
  IV:["CIV-10","CIV-11","CIV-12"]
});
export const HERO = Object.freeze({
  Humans:"Lord Aldren",Orcs:"Gorrak Bloodfang",Dwarfs:"Thordin Ironvein",
  "Tree Elves":"Sylara Windleaf","Corrupt Elves":"Vaelith Nightshade",Ursa:"Torvak Stonepaw"
});
export const LEGENDARY_LAND = Object.freeze({
  Humans:"Royal Juggernaut",Orcs:"War Mammoth",Dwarfs:"Runic Colossus",
  "Tree Elves":"Elder Treant","Corrupt Elves":"Eclipse Avatar",Ursa:"Great Ursarch"
});
export const LEGENDARY_SHIP = Object.freeze({
  Humans:"Crown Sovereign",Orcs:"Bloodtide Leviathan",Dwarfs:"Mountainbreaker",
  "Tree Elves":"Tidewood Ancient","Corrupt Elves":"Eclipse Dreadnought",Ursa:"Great Ursaship"
});
export const SIEGE_TOWER = Object.freeze({
  Humans:"Royal Siege Tower",Orcs:"Skullbreaker Tower",Dwarfs:"Ironclad Assault Tower",
  "Tree Elves":"Living Canopy Tower","Corrupt Elves":"Umbral Assault Spire",Ursa:"Greatclaw Siege Tower"
});
