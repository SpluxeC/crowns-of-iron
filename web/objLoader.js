import {sampleFactionTexture} from "./factionTextures.js";
import {deformVertex} from "./meshAnimation.js";
import {FACTION_SLUGS,factionMeshPath} from "./factionArt.js";
/** Strict subset of Wavefront OBJ+MTL for Crowns of Iron authored static meshes.
 * OBJ faces become flat-shaded, interleaved world-ready position/color triangles. */
const MAX_VERTICES=20000,MAX_TRIANGLES=20000;
export const MODEL_NAMES=Object.freeze(["worker","infantry","ranged","hero","siege","ship",
 "air","civilian","defense","tower"]);
export function parseMtl(text){
 if(typeof text!=="string"||text.length>200000)throw Error("Invalid MTL source");
 const materials={},lines=text.split(/\r?\n/);let current=null;
 for(const line of lines){
  const args=line.trim().split(/\s+/);if(args[0]==="newmtl"){
   if(!/^[a-z][a-z0-9_-]*$/i.test(args[1]??""))throw Error("Invalid material name");
   current=args[1];materials[current]=[.65,.65,.65];
  }else if(args[0]==="Kd"&&current){
   const v=args.slice(1,4).map(Number);
   if(v.length!==3||v.some(n=>!Number.isFinite(n)||n<0||n>1))
    throw Error("Invalid diffuse color");
   materials[current]=v;
  }
 }
 return materials;
}
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],
 a[0]*b[1]-a[1]*b[0]];
function faceShade(a,b,c){
 const u=b.map((n,i)=>n-a[i]),v=c.map((n,i)=>n-a[i]);
 const n=cross(u,v),length=Math.hypot(...n)||1;
 return Math.min(1,Math.max(.47,.75+.25*n[1]/length));
}
export function parseObj(text,materials){
 if(typeof text!=="string"||text.length>1500000)throw Error("Invalid OBJ source");
 const positions=[],vertices=[],bounds={min:[Infinity,Infinity,Infinity],
  max:[-Infinity,-Infinity,-Infinity]};
 let material="stone",triangles=0;
 for(const raw of text.split(/\r?\n/)){
  const args=raw.trim().split(/\s+/);
  if(args[0]==="v"){
   const p=args.slice(1,4).map(Number);
   if(p.length!==3||p.some(n=>!Number.isFinite(n)||Math.abs(n)>100))
    throw Error("Invalid OBJ vertex");
   positions.push(p);
   if(positions.length>MAX_VERTICES)throw Error("OBJ vertex budget exceeded");
   p.forEach((n,i)=>{bounds.min[i]=Math.min(bounds.min[i],n);
    bounds.max[i]=Math.max(bounds.max[i],n);});
  }else if(args[0]==="usemtl"){
   material=args[1];
   if(!Object.hasOwn(materials,material))throw Error("Undefined OBJ material "+material);
  }else if(args[0]==="f"){
   const tokens=args.slice(1).map(s=>s.split("/")[0]);
   if(tokens.length<3||tokens.length>8)throw Error("Invalid OBJ polygon");
   const poly=tokens.map(t=>{
    const index=Number(t);
    if(!Number.isSafeInteger(index)||index<1||index>positions.length)
     throw Error("OBJ index outside vertex range");
    return positions[index-1];
   });
   for(let i=1;i<poly.length-1;i++){
    const tri=[poly[0],poly[i],poly[i+1]],shade=faceShade(...tri),
      rgb=materials[material]??[.65,.65,.65];
    for(const p of tri)vertices.push(...p,...rgb.map(v=>v*shade));
    triangles++;if(triangles>MAX_TRIANGLES)throw Error("OBJ triangle budget exceeded");
   }
  }else if(!["#","o","g","mtllib","s",""].includes(args[0])){
   throw Error("Unsupported OBJ directive "+args[0]);
  }
 }
 if(!triangles)throw Error("OBJ mesh has no triangles");
 return {vertices:new Float32Array(vertices),triangles,
  vertexCount:vertices.length/6,bounds,materialCount:Object.keys(materials).length};
}
/** No remote URLs: only same-origin, fixed registry model paths. */
export async function loadObjAssetSet(fetcher=fetch){
 const paletteResponse=await fetcher("/assets/models/crowns-palette.mtl");
 if(!paletteResponse.ok)throw Error("Material palette unavailable");
 const materials=parseMtl(await paletteResponse.text());
 const result={};
 for(const name of MODEL_NAMES){
  const response=await fetcher("/assets/models/"+name+".obj");
  if(!response.ok)throw Error("Missing OBJ model "+name);
  result[name]=parseObj(await response.text(),materials);
 }
 return result;
}
/** Fetch all 60 authored faction-specific meshes and validate them against the
 * shared material palette. Non-faction preview assets stay a separate 10-mesh set. */
export async function loadFactionObjSet(fetcher=fetch){
 const paletteResponse=await fetcher("/assets/models/crowns-palette.mtl");
 if(!paletteResponse.ok)throw Error("Faction material palette unavailable");
 const materials=parseMtl(await paletteResponse.text());
 const keys=FACTION_SLUGS.flatMap(faction=>MODEL_NAMES.map(role=>({faction,role})));
 const loaded=await Promise.all(keys.map(async ({faction,role})=>{
  const path=factionMeshPath(faction,role),response=await fetcher(path);
  if(!response.ok)throw Error("Missing faction OBJ "+path);
  return [faction+"/"+role,parseObj(await response.text(),materials)];
 }));
 return Object.fromEntries(loaded);
}
/** Transform authored Y-up model local coords into the battlefield grid. */
export function appendObjVertices(out,mesh,{x=0,y=0,z=0,scale=1,tint=null,
 pose=null,texture=null}={}){
 const src=mesh?.vertices;
 if(!src||!Number.isFinite(scale)||scale<=0)throw Error("Invalid OBJ geometry");
 const maxHeight=mesh.bounds?.max?.[1]??1.5;
 for(let i=0;i<src.length;i+=6){
  const local=pose?deformVertex(src[i],src[i+1],src[i+2],pose,maxHeight):
   [src[i],src[i+1],src[i+2]];
  const pattern=sampleFactionTexture(texture,src[i],src[i+1],src[i+2]);
  out.push(x+local[0]*scale,y+local[1]*scale,z+local[2]*scale,
   Math.min(1,src[i+3]*(tint?.[0]??1)*pattern[0]),
   Math.min(1,src[i+4]*(tint?.[1]??1)*pattern[1]),
   Math.min(1,src[i+5]*(tint?.[2]??1)*pattern[2]));
 }
 return src.length/6;
}
