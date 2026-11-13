/** Versioned, declarative 3D asset registry. Fixed same-origin Wavefront OBJ
 * meshes back these identifiers; no executable model scripts or third-party URLs. */
export const ASSET_SCHEMA_VERSION=1;
export const UNIT_ASSETS=Object.freeze({
 worker:{id:"unit.worker.v1",mesh:"/assets/models/worker.obj",role:"worker",head:.22,shoulder:.25,accessory:"pack",scale:1},
 infantry:{id:"unit.infantry.v1",mesh:"/assets/models/infantry.obj",role:"infantry",head:.24,shoulder:.36,accessory:"shield",scale:1},
 ranged:{id:"unit.ranged.v1",mesh:"/assets/models/ranged.obj",role:"ranged",head:.24,shoulder:.32,accessory:"ranged",scale:1},
 hero:{id:"unit.hero.v1",mesh:"/assets/models/hero.obj",role:"hero",head:.34,shoulder:.56,accessory:"banner",scale:1},
 siege:{id:"unit.siege.v1",mesh:"/assets/models/siege.obj",role:"siege",head:0,shoulder:.60,accessory:"turret",scale:1},
 ship:{id:"unit.ship.v1",mesh:"/assets/models/ship.obj",role:"ship",head:0,shoulder:.68,accessory:"mast",scale:1},
 air:{id:"unit.air.v1",mesh:"/assets/models/air.obj",role:"air",head:0,shoulder:.72,accessory:"wings",scale:1}
});
const RANGED=new Set(["Archer","Stone Slinger","Gunner","Anti-Air Infantry","Scout"]);
const SIEGE=new Set(["Battering Ram","Siege Tower","Heavy Artillery","Heavy War Machine"]);
const SHIPS=new Set(["Raft","Fishing Vessel","Trade Ship","Transport Ship",
 "Light Warship","Heavy Warship","Naval Siege Ship","Legendary Warship"]);
const AIRCRAFT=new Set(["Scout Aircraft","Interceptor","Gunship","Bomber",
 "Air Transport","Aerial Battleship"]);
export function assetForUnit(unit){
 const role=unit?.archetype??"";
 const family=role==="Worker"?"worker":
  SHIPS.has(role)?"ship":AIRCRAFT.has(role)?"air":
  SIEGE.has(role)?"siege":RANGED.has(role)?"ranged":
  (role==="Hero"||role.startsWith("Legendary"))?"hero":"infantry";
 return UNIT_ASSETS[family];
}
export function assetForBuilding(kind){
 const fortified=/Wall|Gate|Tower|Fort|Rampart|Bastion|Palisade/i.test(kind??"");
 const tower=/Tower|Fort|Bastion|Hangar/i.test(kind??"");
 return {id:tower?"building.tower.v1":fortified?"building.defense.v1":"building.basic.v1",
  family:tower?"tower":fortified?"defense":"civilian",
  mesh:"/assets/models/"+(tower?"tower":fortified?"defense":"civilian")+".obj",height:tower?3.3:fortified?2.2:1.9,
  wallColor:fortified?"#9eadaf":"#bda484",roofColor:fortified?"#74838e":"#876a52"};
}
export function validateAssetRegistry(){
 const ids=new Set();
 for(const [name,item] of Object.entries(UNIT_ASSETS)){
  if(!/^[a-z][a-z0-9.]+\.v\d+$/.test(item.id)||ids.has(item.id))
   throw Error("Invalid asset ID: "+name);
  ids.add(item.id);
  if(!Number.isFinite(item.shoulder)||item.shoulder<=0||item.shoulder>2)
   throw Error("Invalid asset dimensions: "+name);
 }
 return {schema:ASSET_SCHEMA_VERSION,unitFamilies:ids.size,buildingFamilies:3};
}
