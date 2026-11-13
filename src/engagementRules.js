import {movementDomain} from "./movementDomains.js";
const ANTIAIR=new Set(["Anti-Air Infantry","Interceptor","Gunship","Aerial Battleship"]);
const SHORE_RANGED=new Set(["Stone Slinger","Archer","Gunner","Anti-Air Infantry",
  "Mechanized Infantry","Heavy Artillery","Heavy War Machine","Legendary Land"]);
const SHORE_SIEGE=new Set(["Heavy Warship","Naval Siege Ship","Legendary Warship"]);
export function canEngage(attacker,target){
 const attackerDomain=movementDomain(attacker.archetype);
 const targetDomain=movementDomain(target.archetype);
 if(targetDomain==="air")return ANTIAIR.has(attacker.archetype);
 if(attackerDomain==="air")return attacker.attack>0;
 if(attackerDomain==="naval"&&targetDomain==="land")return SHORE_SIEGE.has(attacker.archetype);
 if(attackerDomain==="land"&&targetDomain==="naval")return SHORE_RANGED.has(attacker.archetype);
 return attacker.attack>0;
}
export function mayAttackStructure(unit){
 return unit.attack>0&&!(movementDomain(unit.archetype)==="naval"&&
   !SHORE_SIEGE.has(unit.archetype));
}
