import {readFile} from "node:fs/promises";
import {parseMtl,parseObj} from "../web/objLoader.js";
import {parsePpm} from "../web/factionTextures.js";
import {FACTION_SLUGS} from "../web/factionArt.js";
import {rigForFaction} from "../web/rigProfiles.js";
import {ANIMATION_CLIPS} from "../web/animationClips.js";
import {exportSkinnedGltf} from "../scripts/export_skinned_gltf.js";
/** Cached, deterministic generated glTF assets, served from the allowlisted
 * development server. npm run export-skinned-gltf also writes real .gltf files. */
const cache=new Map(),pending=new Map();
let materials=null;
export async function gltfForFaction(slug){
 if(!FACTION_SLUGS.includes(slug))throw Error("Unknown skinned glTF faction");
 if(cache.has(slug))return cache.get(slug);
 if(pending.has(slug))return pending.get(slug);
 const task=(async()=>{
  if(!materials)materials=parseMtl(await readFile(new URL(
   "../assets/models/crowns-palette.mtl",import.meta.url),"utf8"));
  const raw=await readFile(new URL("../assets/models/roster/"+slug+
   "/swordsman.obj",import.meta.url),"utf8");
  const mesh=parseObj(raw,materials);
  const img=parsePpm(await readFile(new URL("../assets/textures/factions/"+
   slug+".ppm",import.meta.url),"utf8"));
  const text=JSON.stringify(exportSkinnedGltf(mesh,rigForFaction(slug),
   ANIMATION_CLIPS,img,{name:slug+" Swordsman"}));
  if(text.length>8_000_000)throw Error("Generated glTF exceeds response budget");
  cache.set(slug,text);return text;
 })().finally(()=>pending.delete(slug));
 pending.set(slug,task);return task;
}
export function gltfCacheStats(){return {loaded:cache.size,pending:pending.size};}
