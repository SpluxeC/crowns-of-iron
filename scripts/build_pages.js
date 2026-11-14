/** Generate a static GitHub Pages site. Does not copy Node multiplayer runtime.
 * Models are exported ahead of time; GitHub Pages never runs a game server. */
import {cp,mkdir,rm,writeFile,readFile,readdir} from "node:fs/promises";
import {dirname,join,resolve} from "node:path";
import {fileURLToPath} from "node:url";
import {exportSkinnedRoster} from "./export_skinned_gltf.js";
import {exportAllVehicles} from "./export_vehicle_gltf.js";
import {ALL_SKINNED_ROLES} from "../web/skinnedRoster.js";
const root=resolve(dirname(fileURLToPath(import.meta.url)),"..");
const target=join(root,"dist","pages");
const base=process.env.PAGES_BASE??"/crowns-of-iron/";
if(!/^\/[a-z0-9/-]+\/$/.test(base)||base.includes("//"))
 throw Error("Invalid GitHub Pages base path");
await rm(target,{force:true,recursive:true});
const people=await exportSkinnedRoster(ALL_SKINNED_ROLES);
const vehicles=await exportAllVehicles();
if(people.length!==96||vehicles.length!==120)
 throw Error("Expected 216 prebuilt glTF assets");
await mkdir(target,{recursive:true});
for(const folder of ["assets","data","src","web"])
 await cp(join(root,folder),join(target,folder),{recursive:true,force:true,
  filter:path=>!path.split(/[\\/]/).some(part=>
   [".git",".local","node_modules","dist","artifacts"].includes(part))});
const html=(await readFile(join(root,"web","skirmish.html"),"utf8"))
 .replace("<head>","<head><base href=\""+base+"\">");
await writeFile(join(target,"index.html"),html);
const gallery=(await readFile(join(root,"web","modelGallery.html"),"utf8"))
 .replace("<head>","<head><base href=\""+base+"\">")
 .replace('src="/modelGallery.js"','src="./web/modelGallery.js"');
await mkdir(join(target,"model-gallery"),{recursive:true});
await writeFile(join(target,"model-gallery","index.html"),gallery);
const jsFiles=await readdir(join(target,"web"));
for(const file of jsFiles.filter(x=>x.endsWith(".js"))){
 const path=join(target,"web",file);
 let code=await readFile(path,"utf8");
 // Fetch paths resolve against document <base> (site root), not module URL.
 code=code.replaceAll('"/assets/','"assets/').replaceAll("'/assets/","'assets/");
 // Old gallery uses root-absolute imports, which fail below a project-pages prefix.
 if(file==="modelGallery.js")code=code.replaceAll('from "/','from "./');
 await writeFile(path,code);
}
await writeFile(join(target,".nojekyll"),"");
await writeFile(join(target,"404.html"),html);
const info={siteBase:base,version:"12.4.0",mode:"single-player-ai",
 prebuilt:{humanoids:people.length,vehicles:vehicles.length},
 gameplayRuntime:"browser-web-worker",multiplayerServerShipped:false};
await writeFile(join(target,"site-manifest.json"),JSON.stringify(info,null,2)+"\n");
console.log(JSON.stringify(info));
