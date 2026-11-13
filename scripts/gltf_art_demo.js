import {readFile} from "node:fs/promises";
import {exportFactionInfantry} from "./export_skinned_gltf.js";
import {validateSkinnedGltf,sampleSkinnedGltf} from "../web/skinnedGltf.js";
import {FACTION_SLUGS} from "../web/factionArt.js";
import {assert} from "../src/util.js";
const exported=await exportFactionInfantry();
assert(exported.length===6&&exported.every(x=>x.joints===7&&x.clips===3));
let totalVertices=0,poseChanges=0,bytes=0;
for(const faction of FACTION_SLUGS){
 const source=await readFile(new URL("../assets/gltf/"+faction+"/swordsman.gltf",
  import.meta.url),"utf8");
 const model=validateSkinnedGltf(JSON.parse(source));
 assert(model.textureEmbedded);
 const first=sampleSkinnedGltf(model,"idle",0),
  second=sampleSkinnedGltf(model,"attack",250);
 assert(first.vertices.length===model.count*6);
 if(first.vertices.some((v,i)=>v!==second.vertices[i]))poseChanges++;
 totalVertices+=model.count;bytes+=Buffer.byteLength(source);
}
assert(poseChanges===6,"All six skins must move between animation clips");
console.log(JSON.stringify({phase:"8.7–9.0",skinnedGltf2Assets:6,
 independentlyValidatedSkins:6,jointsPerSkin:7,
 clipsPerFaction:3,embeddedPngPbrTextures:6,
 animatedPoseChanges:poseChanges,vertices:totalVertices,
 totalExportBytes:bytes,
 delivery:"The six .gltf files are generated locally and uploaded as a GitHub Actions downloadable artifact",
 limitations:"Only the six Swordsman examples are glTF skinned; other 210 roster models still use animated OBJ. GPU shader is diffuse textured, not full PBR. No real browser pixel regression or hardware FPS validation."},null,2));
