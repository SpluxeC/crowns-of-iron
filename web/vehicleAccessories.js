/** Visual-only secondary and tertiary rigid attachments for specialized vehicles.
 * Deterministic low-poly meshes: no authored base OBJ segmentation. */
import {vehicleDomain} from "./vehicleArt.js";
function box(out,c,s,color){
 const [x,y,z]=c,[w,h,d]=s,x0=x-w/2,x1=x+w/2,y0=y-h/2,y1=y+h/2,z0=z-d/2,z1=z+d/2;
 const faces=[
  [[x0,y0,z1],[x1,y0,z1],[x1,y1,z1],[x0,y1,z1]],
  [[x1,y0,z0],[x0,y0,z0],[x0,y1,z0],[x1,y1,z0]],
  [[x0,y1,z0],[x0,y1,z1],[x1,y1,z1],[x1,y1,z0]],
  [[x0,y0,z1],[x0,y0,z0],[x1,y0,z0],[x1,y0,z1]],
  [[x1,y0,z1],[x1,y0,z0],[x1,y1,z0],[x1,y1,z1]],
  [[x0,y0,z0],[x0,y0,z1],[x0,y1,z1],[x0,y1,z0]]
 ];
 for(const face of faces)for(const idx of [0,1,2,0,2,3]){
  out.positions.push(...face[idx]);
  out.uvs.push(...[[0,0],[1,0],[1,1],[0,1]][idx]);
  out.colors.push(...color,1);
 }
}
function part(name,anchor,boxes){
 const mesh={name,anchor,positions:[],uvs:[],colors:[]};
 for(const [center,size,color] of boxes)box(mesh,center,size,color);
 return {...mesh,count:mesh.positions.length/3};
}
export function vehicleAccessories(role,bounds){
 const domain=vehicleDomain(role);
 if(!domain||!bounds?.min||!bounds?.max||bounds.min.length!==3||bounds.max.length!==3)
  throw Error("Invalid vehicle attachment bounds");
 const [minX,minY,minZ]=bounds.min,[maxX,maxY,maxZ]=bounds.max;
 const w=Math.max(.15,maxX-minX),h=Math.max(.15,maxY-minY),
  d=Math.max(.15,maxZ-minZ),midX=(minX+maxX)/2,midZ=(minZ+maxZ)/2;
 if(domain==="air")return [
  part("tail rudder",[midX,minY+h*.55,minZ-d*.34],[
   [[0,0,0],[w*.08,h*.42,d*.07],[.65,.72,.8]]]),
  part("wing aileron",[midX+w*.34,minY+h*.48,midZ],[
   [[0,0,0],[w*.32,h*.06,d*.11],[.47,.55,.62]]])
 ];
 if(domain==="naval")return [
  part("rear rudder",[midX,minY+h*.3,minZ-d*.38],[
   [[0,0,0],[w*.085,h*.35,d*.1],[.51,.43,.29]]]),
  part("secondary turret",[midX-w*.2,minY+h*.72,midZ-d*.17],[
   [[0,0,0],[w*.20,h*.13,d*.20],[.5,.52,.54]],
   [[0,0,d*.12],[w*.06,h*.06,d*.26],[.25,.28,.31]]])
 ];
 return [
  part("drive wheel",[midX+w*.3,minY+h*.22,midZ],[
   [[0,0,0],[w*.18,h*.35,d*.18],[.35,.31,.25]],
   [[0,0,0],[w*.06,h*.40,d*.06],[.64,.57,.39]]]),
  part("armored shield",[midX,minY+h*.53,midZ+d*.27],[
   [[0,0,0],[w*.55,h*.40,d*.07],[.49,.49,.47]]])
 ];
}
export function accessoryQuaternion(domain,partIndex,mode,timeSeconds){
 if(!["idle","walk","attack","hit","death"].includes(mode)||
  ![0,1].includes(partIndex)||!Number.isFinite(timeSeconds)||
  !["air","naval","siege"].includes(domain))
  throw Error("Invalid accessory animation");
 const t=timeSeconds,attack=mode==="attack",moving=mode==="walk";
 const pulse=mode==="death"?0:mode==="hit"?.13*Math.sin(Math.PI*Math.min(1,t/.22)):
  (attack?.2:moving?.12:.035)*Math.sin(t*(attack?9:3));
 let axis,angle;
 if(domain==="air"){
  axis=partIndex===0?"y":"x";
  angle=partIndex===0?pulse:(moving?-.18:0)+pulse;
 }else if(domain==="naval"){
  axis="y";
  angle=partIndex===0?(moving?.28:attack?.13:0)+pulse:
   (attack?.36:0)+pulse;
 }else{
  axis=partIndex===0?"x":"z";
  angle=partIndex===0?t*(moving?9:attack?4:0):
   (attack?-.20:0)+pulse;
 }
 const sin=Math.sin(angle/2),cos=Math.cos(angle/2);
 return axis==="x"?[sin,0,0,cos]:axis==="y"?[0,sin,0,cos]:[0,0,sin,cos];
}
