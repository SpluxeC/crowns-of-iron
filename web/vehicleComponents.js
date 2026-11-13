/** Deterministic rigid subcomponent meshes for first-pass vehicle articulation.
 * Geometric appendages, NOT segmentation of original authored OBJ geometry.
 * Local Y-up meshes are attached beneath the primary vehicle glTF node. */
import {vehicleDomain} from "./vehicleArt.js";
function box(out,x,y,z,w,h,d,color){
 const x0=x-w/2,x1=x+w/2,y0=y-h/2,y1=y+h/2,z0=z-d/2,z1=z+d/2;
 const faces=[
  [[x0,y0,z1],[x1,y0,z1],[x1,y1,z1],[x0,y1,z1]],
  [[x1,y0,z0],[x0,y0,z0],[x0,y1,z0],[x1,y1,z0]],
  [[x0,y1,z0],[x0,y1,z1],[x1,y1,z1],[x1,y1,z0]],
  [[x0,y0,z1],[x0,y0,z0],[x1,y0,z0],[x1,y0,z1]],
  [[x1,y0,z1],[x1,y0,z0],[x1,y1,z0],[x1,y1,z1]],
  [[x0,y0,z0],[x0,y0,z1],[x0,y1,z1],[x0,y1,z0]]
 ];
 for(const quad of faces){
  const triangles=[0,1,2,0,2,3];
  const tex=[[0,0],[1,0],[1,1],[0,1]];
  for(const index of triangles){
   out.positions.push(...quad[index]);
   out.uvs.push(...tex[index]);
   out.colors.push(...color,1);
  }
 }
}
export function vehicleComponent(role,bounds){
 const domain=vehicleDomain(role);
 if(!domain||!bounds?.min||!bounds?.max)throw Error("Unknown vehicle component");
 const [minX,minY,minZ]=bounds.min,[maxX,maxY,maxZ]=bounds.max;
 const width=Math.max(.15,maxX-minX),height=Math.max(.15,maxY-minY),
  depth=Math.max(.15,maxZ-minZ);
 const anchor=[(minX+maxX)/2,minY+height*.75,(minZ+maxZ)/2];
 const data={positions:[],uvs:[],colors:[]};
 if(domain==="air"){
  // Two flat crossed propeller blades and a contrasting central hub.
  box(data,0,0,0,width*.7,Math.max(height*.04,.035),depth*.045,[.79,.82,.86]);
  box(data,0,0,0,width*.045,Math.max(height*.72,.2),depth*.045,[.79,.82,.86]);
  box(data,0,0,0,width*.13,height*.13,depth*.12,[.24,.26,.31]);
 }else if(domain==="naval"){
  // Deck-mounted rotating gun turret with a forward barrel.
  box(data,0,0,0,width*.28,height*.18,depth*.23,[.45,.51,.55]);
  box(data,0,0,depth*.18,width*.075,height*.065,depth*.42,[.23,.27,.32]);
 }else{
  // Siege engine weapon assembly: independently pivoting long barrel.
  box(data,0,0,0,width*.25,height*.18,depth*.24,[.46,.42,.35]);
  box(data,0,0,depth*.28,width*.09,height*.09,depth*.62,[.32,.33,.35]);
 }
 return {...data,anchor,domain,count:data.positions.length/3};
}
export function componentQuaternion(domain,mode,timeSeconds){
 if(!["idle","walk","attack","hit","death"].includes(mode)||
  !Number.isFinite(timeSeconds))throw Error("Invalid component animation");
 if(mode==="death")return [0,0,0,1];
 if(domain==="air"){
  const spin=timeSeconds*(mode==="attack"?18:mode==="walk"?15:11);
  return [0,0,Math.sin(spin/2),Math.cos(spin/2)];
 }
 const angle=mode==="attack"?.45*Math.sin(timeSeconds*10):
  mode==="hit"?-.25*Math.sin(Math.PI*timeSeconds/.22):
  .14*Math.sin(timeSeconds*1.8);
 if(domain==="naval")return [0,Math.sin(angle/2),0,Math.cos(angle/2)];
 return [Math.sin(angle/2),0,0,Math.cos(angle/2)];
}
