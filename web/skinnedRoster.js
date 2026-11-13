import {ROSTER_ROLES,ROLE_SLUGS,rosterDomain} from "./rosterArt.js";
import {factionSlug,FACTION_SLUGS} from "./factionArt.js";
/** Scope is explicit: six land/humanoid roles per faction, not all 216 assets. */
export const SKINNED_ROLES=Object.freeze(["Worker","Swordsman","Archer",
 "Pikeman","Healer","Hero"]);
export const SKINNED_ASSET_COUNT=FACTION_SLUGS.length*SKINNED_ROLES.length;
export function skinnedRoleSlug(role){
 return SKINNED_ROLES.includes(role)?ROLE_SLUGS[role]:null;
}
export function skinnedGltfPath(faction,role){
 const slug=factionSlug(faction),r=skinnedRoleSlug(role);
 return slug&&r?"/assets/gltf/"+slug+"/"+r+".gltf":null;
}
