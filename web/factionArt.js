/** Deterministic six-faction mesh selection, independent of network state. */
export const FACTION_SLUGS=Object.freeze(["humans","orcs","dwarfs","tree-elves",
 "corrupt-elves","ursa"]);
export const FACTION_NAMES=Object.freeze({
 "Humans":"humans","Orcs":"orcs","Dwarfs":"dwarfs",
 "Tree Elves":"tree-elves","Corrupt Elves":"corrupt-elves","Ursa":"ursa"
});
const familySet=new Set(["worker","infantry","ranged","hero","siege","ship","air",
 "civilian","defense","tower"]);
export function factionSlug(name){
 return FACTION_NAMES[name]??(FACTION_SLUGS.includes(name)?name:null);
}
export function factionMeshKey(name,family){
 const slug=factionSlug(name);
 return slug&&familySet.has(family)?slug+"/"+family:null;
}
export function factionMeshPath(name,family){
 const key=factionMeshKey(name,family);
 return key?"/assets/models/factions/"+key+".obj":null;
}
