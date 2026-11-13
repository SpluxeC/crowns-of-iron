import {refreshUnitTechnology,researchMultiplier} from "./technologyEffects.js";
const EXCLUDED=new Set(["Worker","Scout","Hero","Legendary Land","Legendary Warship"]);
export function grantCombatExperience(player,attacker,defender){
 if(!attacker?.alive||EXCLUDED.has(attacker.archetype))return 0;
 const amount=Math.round(100*Math.max(1,defender.pop??1)*researchMultiplier(player,"combatXp"));
 attacker.experience=(attacker.experience??0)+amount;
 const rank=attacker.experience>=300?"Elite":attacker.experience>=100?"Veteran":"Recruit";
 if(attacker.rank!==rank){attacker.rank=rank;refreshUnitTechnology(player,attacker);}
 return amount;
}
