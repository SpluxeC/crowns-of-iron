import {readFile} from "node:fs/promises";
import {parseObj,parseMtl} from "../web/objLoader.js";
import {parsePpm} from "../web/factionTextures.js";
import {refineFactionTexture} from "../web/materialDetail.js";
import {exportVehicleGltf} from "../scripts/export_vehicle_gltf.js";
import {FACTION_SLUGS} from "../web/factionArt.js";
import {ROLE_SLUGS} from "../web/rosterArt.js";
import {VEHICLE_ROLES} from "../web/vehicleArt.js";
/** Serve only exact built-in model identities, not user-selected paths. */
const cache=new Map(),pending=new Map();let palette=null;
export async function vehicleAssetFor(faction,role){
 if(!FACTION_SLUGS.includes(faction)||!VEHICLE_ROLES.includes(role))
  throw Error("Unknown specialized vehicle identity");
 const key=faction+"/"+role;
 if(cache.has(key))return cache.get(key);
 if(pending.has(key))return pending.get(key);
 const task=(async()=>{
  if(!palette)palette=parseMtl(await readFile(new URL(
   "../assets/models/crowns-palette.mtl",import.meta.url),"utf8"));
  const raw=await readFile(new URL("../assets/models/roster/"+faction+"/"+ROLE_SLUGS[role]+
   ".obj",import.meta.url),"utf8");
  const original=await readFile(new URL("../assets/textures/factions/"+faction+
   ".ppm",import.meta.url),"utf8");
  const obj=parseObj(raw,palette),texture=refineFactionTexture(parsePpm(original),faction);
  const json=JSON.stringify(exportVehicleGltf(obj,texture,{faction,role}));
  if(json.length>8_000_000)throw Error("Vehicle glTF exceeds HTTP size budget");
  cache.set(key,json);return json;
 })().finally(()=>pending.delete(key));
 pending.set(key,task);return task;
}
export function vehicleAssetCacheStats(){return {loaded:cache.size,pending:pending.size};}
