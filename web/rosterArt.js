import {assetForUnit} from "./assetManifest.js";
import {factionSlug,FACTION_SLUGS} from "./factionArt.js";
/** Complete reconciled RTS roster. One separately authored mesh per faction/role. */
export const LAND_ROLES=Object.freeze([
 "Worker","Scout","Club Fighter","Stone Slinger","Stone Spearman","Swordsman",
 "Archer","Pikeman","Raider","Heavy Infantry","Heavy Mobile","Battering Ram",
 "Siege Tower","Healer","Converter","Hero","Gunner","Heavy Artillery",
 "Anti-Air Infantry","Mechanized Infantry","Heavy War Machine","Legendary Land"
]);
export const NAVAL_ROLES=Object.freeze([
 "Raft","Fishing Vessel","Trade Ship","Transport Ship","Light Warship",
 "Heavy Warship","Naval Siege Ship","Legendary Warship"
]);
export const AIR_ROLES=Object.freeze([
 "Scout Aircraft","Interceptor","Gunship","Bomber","Air Transport",
 "Aerial Battleship"
]);
export const ROSTER_ROLES=Object.freeze([...LAND_ROLES,...NAVAL_ROLES,...AIR_ROLES]);
export const ROLE_SLUGS=Object.freeze(Object.fromEntries(ROSTER_ROLES.map(role=>[
 role,role.toLowerCase().replace(/[^a-z0-9]+/g,"-")])));
const roleSet=new Set(ROSTER_ROLES);
export function roleFamily(role){
 if(!roleSet.has(role))return null;
 if(NAVAL_ROLES.includes(role))return "ship";
 if(AIR_ROLES.includes(role))return "air";
 if(["Battering Ram","Siege Tower","Heavy Artillery","Heavy War Machine",
  "Legendary Land"].includes(role))return "siege";
 if(["Healer","Converter"].includes(role))return "hero";
 if(["Pikeman","Stone Spearman"].includes(role))return "infantry";
 return assetForUnit({archetype:role}).role;
}
export function rosterMeshKey(faction,role){
 const slug=factionSlug(faction);
 return slug&&roleSet.has(role)?slug+"/"+ROLE_SLUGS[role]:null;
}
export function rosterMeshPath(faction,role){
 const key=rosterMeshKey(faction,role);
 return key?"/assets/models/roster/"+key+".obj":null;
}
export function rosterDomain(role){
 return LAND_ROLES.includes(role)?"land":NAVAL_ROLES.includes(role)?"naval":
  AIR_ROLES.includes(role)?"air":null;
}
export const ROSTER_MESH_COUNT=FACTION_SLUGS.length*ROSTER_ROLES.length;
