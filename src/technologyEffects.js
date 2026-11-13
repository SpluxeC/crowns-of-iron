// Executable v0.2 effects. Descriptive unlocks and specialized systems deliberately
// remain unsupported until their corresponding gameplay mechanisms exist.
const specs={
"ECO-01":{kind:"gather",resource:"all",pct:.05},
"ECO-02":{kind:"dropoff",pct:.05},
"ECO-10":{kind:"carry",pct:.08},
"ECO-03":{kind:"gather",resource:"Stone",pct:.08},
"ECO-04":{kind:"gather",resource:"Metal",pct:.08},
"ECO-08":{kind:"gather",resource:"all",pct:.05},
"MIL-01":{kind:"unitAttack",target:"physical",pct:.05},
"MIL-02":{kind:"unitAttack",target:"physical",pct:.05},
"MIL-03":{kind:"unitHp",target:"infantry",pct:.05},
"MIL-04":{kind:"unitHp",target:"infantry",pct:.05},
"MIL-05":{kind:"unitSpeed",target:"infantry",pct:.05},
"MIL-06":{kind:"unitHp",target:"infantry",pct:.05},
"MIL-08":{kind:"unitAttack",target:"ranged",pct:.05},
"MIL-09":{kind:"unitAttack",target:"mobile",pct:.05},
"NAV-01":{kind:"unitSpeed",target:"ship",pct:.05},
"NAV-02":{kind:"unitHp",target:"ship",pct:.08},
"NAV-06":{kind:"unitSpeed",target:"ship",pct:.05},
"NAV-07":{kind:"unitHp",target:"heavyShip",pct:.08},
"NAV-08":{kind:"unitAttack",target:"navalSiege",pct:.10},
"NAV-09":{kind:"unitSpeed",target:"steamShip",pct:.05},
"AIR-02":{kind:"scoutSight",pct:.10},
"AIR-03":{kind:"unitSpeed",target:"air",pct:.05},
"AIR-04":{kind:"unitSpeed",target:"air",pct:.05},
"AIR-05":{kind:"unitHp",target:"air",pct:.08},
"AIR-06":{kind:"unitAttack",target:"Interceptor",pct:.05},
"AIR-07":{kind:"unitAttack",target:"Gunship",pct:.05},
"AIR-08":{kind:"structureAttack",target:"Bomber",pct:.08},
"AIR-10":{kind:"unitAttack",target:"combatAir",pct:.05},
"SPC-01":{kind:"healing",pct:.05},
"SPC-07":{kind:"salvage",pct:.05},
"SPC-09":{kind:"repair",pct:.10},
"FAC-01":{kind:"gather",resource:"Food",pct:.05},
"FAC-02":{kind:"gather",resource:"Wood",pct:.05},
"FAC-04":{kind:"gather",resource:"Stone",pct:.05},
"FAC-05":{kind:"unitAttack",target:"earlyMelee",pct:.05},
"FAC-06":{kind:"unitHp",target:"infantry",pct:.05},
"FAC-07":{kind:"production",pct:.05},
"FAC-08":{kind:"unitAttack",target:"siege",pct:.08},
"FAC-09":{kind:"healing",pct:.05},
"FAC-11":{kind:"unitAttack",target:"Legendary Land",pct:.08},
"FAC-12":{kind:"unitHp",target:"heavyLand",pct:.10},
"FAC-15":{kind:"unitHp",target:"ship",pct:.08},
"FAC-16":{kind:"unitAttack",target:"ranged",pct:.05},
"FAC-17":{kind:"unitAttack",target:"combatAir",pct:.08},
"FAC-18":{kind:"unitHp",target:"combatAir",pct:.10},
"BLD-01":{kind:"buildingHp",target:"all",pct:.08},
"BLD-06":{kind:"buildingHp",target:"masonry",pct:.10},
"BLD-08":{kind:"buildingHp",target:"industrial",pct:.10},
"BLD-09":{kind:"buildingHp",target:"steampunk",pct:.10},
"FAC-03":{kind:"buildingHp",target:"basic",pct:.05},
"FAC-10":{kind:"buildingHp",target:"fortification",pct:.08},
"BLD-10":{kind:"townHousing",amount:5}
};
export const IMPLEMENTED_TECH_EFFECTS=Object.freeze(specs);
const infantry=new Set(["Club Fighter","Stone Spearman","Swordsman","Archer","Pikeman","Heavy Infantry","Gunner","Anti-Air Infantry","Mechanized Infantry"]);
const ships=new Set(["Raft","Fishing Vessel","Trade Ship","Transport Ship","Light Warship","Heavy Warship","Naval Siege Ship","Legendary Warship"]);
const aircraft=new Set(["Scout Aircraft","Interceptor","Gunship","Bomber","Air Transport","Aerial Battleship"]);
const ranged=new Set(["Stone Slinger","Archer","Gunner","Anti-Air Infantry","Mechanized Infantry","Interceptor","Gunship","Bomber"]);
const heavyShips=new Set(["Heavy Warship","Naval Siege Ship","Legendary Warship"]);
const heavyLand=new Set(["Heavy Infantry","Heavy Mobile","Heavy War Machine","Legendary Land"]);
function matches(unit,target){
 const role=unit.archetype;
 switch(target){
 case "physical":return ["Slash","Pierce","Crush"].includes(unit.type);
 case "infantry":return infantry.has(role);
 case "ranged":return ranged.has(role);
 case "mobile":return ["Raider","Heavy Mobile","Scout"].includes(role);
 case "ship":return ships.has(role);
 case "heavyShip":return heavyShips.has(role);
 case "navalSiege":return role==="Naval Siege Ship";
 case "air":return aircraft.has(role);
 case "combatAir":return aircraft.has(role)&&!["Scout Aircraft","Air Transport"].includes(role);
 case "earlyMelee":return ["Club Fighter","Stone Spearman","Swordsman","Pikeman"].includes(role);
 case "heavyLand":return heavyLand.has(role);
 case "steamShip":return heavyShips.has(role);
 case "siege":return ["Battering Ram","Heavy Artillery","Heavy War Machine","Naval Siege Ship"].includes(role);
 default:return role===target;
 }
}
export function technologyEffectStatus(id){
 if(id.startsWith("CIV-"))return "age-progression";
 return specs[id]?"implemented":"pending";
}
export function researchMultiplier(player,kind,{unit,resource}={}){
 let total=0;
 for(const id of player.completed??[]){
   const effect=specs[id];
   if(!effect||effect.kind!==kind)continue;
   if(effect.target&&(!unit||!matches(unit,effect.target)))continue;
   if(effect.resource&&effect.resource!=="all"&&effect.resource!==resource)continue;
   total+=effect.pct??0;
 }
 return 1+total; // additive research stacking; no multiplicative compounding
}
export function refreshUnitTechnology(player,unit){
 if(!unit.alive)return;
 unit.baseMaxHp??=unit.maxHp;
 unit.baseAttack??=unit.attack;
 unit.baseSpeed??=unit.speed;
 const hp=Math.max(1,Math.round(unit.baseMaxHp*researchMultiplier(player,"unitHp",{unit})));
 const lost=unit.maxHp-unit.hp;
 unit.maxHp=hp;unit.hp=Math.max(1,hp-lost);
 unit.attack=Math.round(unit.baseAttack*researchMultiplier(player,"unitAttack",{unit})*1000)/1000;
 if(unit.baseSpeed>0)unit.speed=Math.round(unit.baseSpeed*researchMultiplier(player,"unitSpeed",{unit})*1000)/1000;
}
export function structureTechnologyMultiplier(player,kind){
 const basic=new Set(["Shelter","Resource Depot","Training Camp","Farm"]);
 const masonry=new Set(["Stone Wall","Reinforced Stone Wall","Stone Gatehouse","Fortress","Artillery Bastion","Watchtower"]);
 const industrial=new Set(["Industrial Rampart","Industrial Gate","Artillery Bastion","Anti-Air Tower"]);
 const steampunk=new Set(["Steampunk Armored Wall","Powered Gate"]);
 const fortified=new Set([...masonry,...industrial,...steampunk,"Primitive Barrier","Primitive Gate","Timber Palisade","Reinforced Palisade"]);
 let bonus=0;
 for(const id of player.completed??[]){
   const spec=specs[id];
   if(spec?.kind!=="buildingHp")continue;
   if(spec.target==="all"||
    (spec.target==="basic"&&basic.has(kind))||
    (spec.target==="masonry"&&masonry.has(kind))||
    (spec.target==="industrial"&&industrial.has(kind))||
    (spec.target==="steampunk"&&steampunk.has(kind))||
    (spec.target==="fortification"&&fortified.has(kind)))bonus+=spec.pct;
 }
 return 1+bonus;
}
export function refreshStructureTechnology(match,player){
 for(const site of Object.values(match.constructions??{})){
  if(!site.completed||site.owner!==player.id)continue;
  site.rawBaseHp??=site.maxHp;
  const newMax=Math.round(site.rawBaseHp*
    (site.localHpFactor??1)*structureTechnologyMultiplier(player,site.kind));
  const lost=Math.max(0,site.maxHp-site.hp);
  site.maxHp=newMax;site.hp=Math.max(1,newMax-lost);
 }
}
export function applyTechnologyCompletion(player,id){
 const effect=specs[id];
 if(!effect)return;
 if(effect.kind.startsWith("unit"))for(const unit of player.units)refreshUnitTechnology(player,unit);
 if(effect.kind==="townHousing")player.popCap=Math.min(300,player.popCap+effect.amount);
}
export function executableCoverage(ids){
 const entries=[...ids];
 return {total:entries.length,ageProgression:entries.filter(x=>x.startsWith("CIV-")).length,
 implemented:entries.filter(x=>specs[x]).length,
 pending:entries.filter(x=>!x.startsWith("CIV-")&&!specs[x]).length};
}
