import {FACTION_SLUGS,factionSlug} from "./factionArt.js";
/** Small, original portable-pixmap RGB patterns, sampled into model vertex colors.
 * Unlike UV/PBR texturing, this deliberately uses deterministic planar projection. */
export function parsePpm(text){
 if(typeof text!=="string"||text.length>400000)throw Error("Invalid PPM source");
 const parts=text.replace(/#[^\r\n]*/g," ").trim().split(/\s+/);
 if(parts[0]!=="P3")throw Error("Only ASCII P3 textures supported");
 const width=Number(parts[1]),height=Number(parts[2]),max=Number(parts[3]);
 if(!Number.isInteger(width)||!Number.isInteger(height)||width<1||height<1||
  width>64||height>64||max!==255)throw Error("Invalid PPM dimensions");
 if(parts.length!==4+width*height*3)throw Error("PPM pixel count mismatch");
 const pixels=new Uint8Array(width*height*3);
 for(let i=0;i<pixels.length;i++){
  const value=Number(parts[i+4]);
  if(!Number.isInteger(value)||value<0||value>255)throw Error("Invalid PPM pixel");
  pixels[i]=value;
 }
 return {width,height,pixels};
}
export function sampleFactionTexture(texture,x,y,z){
 if(!texture)return [1,1,1];
 const fract=v=>((v%1)+1)%1;
 const u=fract(.5+x*.36+z*.22),v=fract(.5+y*.35-z*.17);
 const ix=Math.min(texture.width-1,Math.floor(u*texture.width));
 const iy=Math.min(texture.height-1,Math.floor(v*texture.height));
 const i=(iy*texture.width+ix)*3;
 return [0,1,2].map(j=>.66+.34*texture.pixels[i+j]/255);
}
export async function loadFactionTextures(fetcher=fetch){
 const pairs=await Promise.all(FACTION_SLUGS.map(async slug=>{
  const response=await fetcher("/assets/textures/factions/"+slug+".ppm");
  if(!response.ok)throw Error("Missing faction texture "+slug);
  return [slug,parsePpm(await response.text())];
 }));
 return Object.fromEntries(pairs);
}
export function textureForFaction(textures,name){
 const slug=factionSlug(name);
 return slug?textures?.[slug]??null:null;
}
