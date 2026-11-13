import {readFile} from "node:fs/promises";
import {parseMtl,parseObj} from "../web/objLoader.js";
import {parsePpm} from "../web/factionTextures.js";
import {FACTION_SLUGS} from "../web/factionArt.js";
import {skinnedRoleSlug,SKINNED_ROLES} from "../web/skinnedRoster.js";
import {rigForFaction} from "../web/rigProfiles.js";
import {ANIMATION_CLIPS} from "../web/animationClips.js";
import {refineFactionTexture} from "../web/materialDetail.js";
import {exportSkinnedGltf} from "../scripts/export_skinned_gltf.js";
/** Cached, deterministic generated glTF assets, served from the allowlisted
 * development server. npm run export-skinned-gltf also writes real .gltf files. */
const cache=new Map(),pending=new Map();
let materials=null;
export async function gltfForFaction(slug,role="Swordsman"){
 if(!FACTION_SLUGS.includes(slug))throw Error("Unknown skinned glTF faction");
 const unitSlug=skinnedRoleSlug(role);
 if(!unitSlug)throw Error("Unknown skinned glTF role");
 const key=slug+"/"+unitSlug;
 if(cache.has(key))return cache.get(key);
 if(pending.has(key))return pending.get(key);
 const task=(async()=>{
  if(!materials)materials=parseMtl(await readFile(new URL(
   "../assets/models/crowns-palette.mtl",import.meta.url),"utf8"));
  const raw=await readFile(new URL("../assets/models/roster/"+slug+
   "/"+unitSlug+".obj",import.meta.url),"utf8");
  const mesh=parseObj(raw,materials);
  const img=refineFactionTexture(parsePpm(await readFile(new URL(
   "../assets/textures/factions/"+slug+".ppm",import.meta.url),"utf8")),slug);
  const text=JSON.stringify(exportSkinnedGltf(mesh,rigForFaction(slug),
   ANIMATION_CLIPS,img,{name:slug+" "+role,role}));
  if(text.length>8_000_000)throw Error("Generated glTF exceeds response budget");
  cache.set(key,text);return text;
 })().finally(()=>pending.delete(key));
 pending.set(key,task);return task;
}
export function gltfCacheStats(){return {loaded:cache.size,pending:pending.size};}
