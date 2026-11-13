import {LAND_ROLES,NAVAL_ROLES,AIR_ROLES,ROLE_SLUGS} from "./rosterArt.js";
import {ALL_SKINNED_ROLES} from "./skinnedRoster.js";
import {factionSlug,FACTION_SLUGS} from "./factionArt.js";
/** Vehicle/large-unit classes use rigid glTF mesh-node animation, not human bones. */
export const VEHICLE_ROLES=Object.freeze([
 ...LAND_ROLES.filter(role=>!ALL_SKINNED_ROLES.includes(role)),
 ...NAVAL_ROLES,...AIR_ROLES
]);
export const VEHICLE_GLTF_COUNT=FACTION_SLUGS.length*VEHICLE_ROLES.length;
export function vehicleGltfPath(faction,role){
 const factionId=factionSlug(faction);
 return factionId&&VEHICLE_ROLES.includes(role)?
  "/assets/gltf-vehicles/"+factionId+"/"+ROLE_SLUGS[role]+".gltf":null;
}
export function vehicleDomain(role){
 return NAVAL_ROLES.includes(role)?"naval":AIR_ROLES.includes(role)?"air":
  VEHICLE_ROLES.includes(role)?"siege":null;
}
