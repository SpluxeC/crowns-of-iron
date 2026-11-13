import {ROLE_SLUGS} from "./rosterArt.js";
import {factionSlug,FACTION_SLUGS} from "./factionArt.js";
/** Scope is explicit: six land/humanoid roles per faction, not all 216 assets. */
export const SKINNED_ROLES=Object.freeze(["Worker","Swordsman","Archer",
 "Pikeman","Healer","Hero"]);
/** Additional humanoid classes with the shared seven-joint algorithmic rig.
 * Siege machines, ships, aircraft and large war machines use specialized motion. */
export const EXTENDED_SKINNED_ROLES=Object.freeze([
 "Scout","Club Fighter","Stone Slinger","Stone Spearman","Raider",
 "Heavy Infantry","Healer","Converter","Gunner","Anti-Air Infantry",
 "Mechanized Infantry"].filter(role=>!SKINNED_ROLES.includes(role)));
export const ALL_SKINNED_ROLES=Object.freeze([...SKINNED_ROLES,
 ...EXTENDED_SKINNED_ROLES]);
export const SKINNED_ASSET_COUNT=FACTION_SLUGS.length*SKINNED_ROLES.length;
export const TOTAL_SKINNED_ASSET_COUNT=FACTION_SLUGS.length*ALL_SKINNED_ROLES.length;
export function skinnedRoleSlug(role){
 return ALL_SKINNED_ROLES.includes(role)?ROLE_SLUGS[role]:null;
}
export function skinnedGltfPath(faction,role){
 const slug=factionSlug(faction),r=skinnedRoleSlug(role);
 return slug&&r?"/assets/gltf/"+slug+"/"+r+".gltf":null;
}
