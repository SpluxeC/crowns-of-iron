/** Bounded, purely cosmetic faction architecture details on existing building meshes.
 * The existing authored OBJ body remains unchanged; accents use colored geometry. */
import {factionSlug} from "./factionArt.js";
const THEMES=Object.freeze({
 humans:{trim:"#c7a66b",roof:"#5c789a",style:"banner"},
 orcs:{trim:"#a76e45",roof:"#713e35",style:"fangs"},
 dwarfs:{trim:"#d1a653",roof:"#68737c",style:"battlements"},
 "tree-elves":{trim:"#9bc483",roof:"#4b7e55",style:"branches"},
 "corrupt-elves":{trim:"#a47cbd",roof:"#54385f",style:"spires"},
 ursa:{trim:"#c0d4dd",roof:"#587e91",style:"totems"}
});
export function buildingTheme(faction){
 const id=factionSlug(faction);
 return id?THEMES[id]:null;
}
/** The emit callback matches the renderer's cube(out,x,z,width,bottom,top,color). */
export function appendFactionArchitecture(out,site,faction,base,emit){
 const theme=buildingTheme(faction);
 if(!theme)return 0;
 if(!Array.isArray(out)||typeof emit!=="function"||
  !site||![site.x,site.y,site.width,site.height,base]
   .every(Number.isFinite)||site.width<=0||site.height<=0)
  throw Error("Invalid architectural fixture");
 const span=Math.min(8,site.width,site.height),
  x=site.x+site.width/2,z=site.y+site.height/2,
  top=base+2.12*span/1.8;
 let pieces=0;
 const add=(xx,zz,w,lo,hi,color)=>{emit(out,xx,zz,w,lo,hi,color);pieces++;};
 // Four narrow corner pilasters make building ownership legible at RTS zoom.
 for(const dx of [-1,1])for(const dz of [-1,1])
  add(x+dx*site.width*.33,z+dz*site.height*.33,.12*span,
   base+.18,top*.7+base*.3,theme.trim);
 const roof=top+.21*span;
 if(theme.style==="banner"){
  add(x,z,.16*span,roof,roof+.58*span,theme.trim);
  add(x+.15*span,z,.28*span,roof+.26*span,roof+.45*span,theme.roof);
 }else if(theme.style==="fangs"||theme.style==="spires"){
  for(const dx of [-1,1])add(x+dx*.31*span,z,.17*span,
   roof,roof+(theme.style==="spires"?.65:.43)*span,theme.roof);
 }else if(theme.style==="branches"){
  for(const dx of [-1,1])add(x+dx*.27*span,z,.20*span,
   roof,roof+.35*span,theme.roof);
  add(x,z,.37*span,roof+.23*span,roof+.38*span,theme.trim);
 }else if(theme.style==="battlements"){
  for(const dx of [-1,0,1])
   add(x+dx*.30*span,z,.22*span,roof,roof+.25*span,theme.trim);
 }else{
  for(const dz of [-1,1])add(x,z+dz*.26*span,.21*span,
   roof,roof+.42*span,theme.trim);
 }
 return pieces;
}
