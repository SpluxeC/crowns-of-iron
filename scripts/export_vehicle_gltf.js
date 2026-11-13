/** Real glTF 2.0 non-skinned animated mesh exports for naval, air and siege classes.
 * Each vehicle's OBJ remains unique; three authored transform-clip channels
 * animate one mesh node. No humanoid joints or skinning on machinery. */
import {readFile,writeFile,mkdir} from "node:fs/promises";
import {parseObj,parseMtl} from "../web/objLoader.js";
import {parsePpm} from "../web/factionTextures.js";
import {refineFactionTexture,roleMaterialProfile} from "../web/materialDetail.js";
import {ppmToPng} from "./export_skinned_gltf.js";
import {FACTION_SLUGS} from "../web/factionArt.js";
import {ROLE_SLUGS} from "../web/rosterArt.js";
import {VEHICLE_ROLES,vehicleDomain} from "../web/vehicleArt.js";
import {vehicleMotion} from "../web/vehicleMotion.js";
import {vehicleComponent,componentQuaternion} from "../web/vehicleComponents.js";
import {vehicleAccessories,accessoryQuaternion} from "../web/vehicleAccessories.js";
import {finishVehicleComponent} from "../web/vehicleFinish.js";
function quaternion(pitch,roll,yaw){
 const sx=Math.sin(pitch/2),cx=Math.cos(pitch/2),sy=Math.sin(yaw/2),
  cy=Math.cos(yaw/2),sz=Math.sin(roll/2),cz=Math.cos(roll/2);
 return [sx*cy*cz+cx*sy*sz,cx*sy*cz-sx*cy*sz,
  cx*cy*sz+sx*sy*cz,cx*cy*cz-sx*sy*sz];
}
function normal(a,b,c){
 const d=b.map((v,i)=>v-a[i]),e=c.map((v,i)=>v-a[i]);
 const n=[d[1]*e[2]-d[2]*e[1],d[2]*e[0]-d[0]*e[2],d[0]*e[1]-d[1]*e[0]];
 const len=Math.hypot(...n)||1;return n.map(x=>x/len);
}
export function exportVehicleGltf(mesh,texture,{faction="humans",role="Bomber"}={}){
 if(!VEHICLE_ROLES.includes(role)||!mesh?.textured||mesh.vertexCount<3||
  mesh.vertexCount>20000||mesh.uvs?.length!==mesh.vertexCount*2)
  throw Error("UV mapped specialized vehicle OBJ required");
 const count=mesh.vertexCount,positions=new Float32Array(count*3),
  normals=new Float32Array(count*3),colors=new Float32Array(count*4);
 for(let i=0;i<count;i++){
  positions.set(mesh.vertices.slice(i*6,i*6+3),i*3);
  colors.set([...mesh.vertices.slice(i*6+3,i*6+6),1],i*4);
 }
 for(let i=0;i<count;i+=3){
  const n=normal(Array.from(positions.slice(i*3,i*3+3)),
   Array.from(positions.slice(i*3+3,i*3+6)),
   Array.from(positions.slice(i*3+6,i*3+9)));
  for(let j=0;j<3;j++)normals.set(n,(i+j)*3);
 }
 const parts=[],bufferViews=[],accessors=[];let bytes=0;
 function accessor(values,type,{min,max,target}={}){
  const countPer={SCALAR:1,VEC2:2,VEC3:3,VEC4:4}[type];
  const data=Buffer.from(values.buffer,values.byteOffset,values.byteLength);
  const pad=(4-(bytes%4))%4;if(pad){parts.push(Buffer.alloc(pad));bytes+=pad;}
  const view=bufferViews.length;
  bufferViews.push({buffer:0,byteOffset:bytes,byteLength:data.length,
   ...(target?{target}:{})});
  parts.push(data);bytes+=data.length;
  const idx=accessors.length;
  accessors.push({bufferView:view,componentType:5126,count:values.length/countPer,type,
   ...(min?{min}:{}),...(max?{max}:{})});
  return idx;
 }
 const position=accessor(positions,"VEC3",{min:mesh.bounds.min,max:mesh.bounds.max,target:34962}),
  n=accessor(normals,"VEC3",{target:34962}),
  uv=accessor(mesh.uvs,"VEC2",{target:34962}),
  color=accessor(colors,"VEC4",{target:34962});
 const part=finishVehicleComponent(vehicleComponent(role,mesh.bounds),faction,"metal");
 const partPosition=accessor(new Float32Array(part.positions),"VEC3",{target:34962}),
  partUv=accessor(new Float32Array(part.uvs),"VEC2",{target:34962}),
  partColors=accessor(new Float32Array(part.colors),"VEC4",{target:34962});
 const partNormals=new Float32Array(part.positions.length);
 for(let i=0;i<part.count;i+=3){
  const a=part.positions.slice(i*3,i*3+3),
   b=part.positions.slice(i*3+3,i*3+6),
   c=part.positions.slice(i*3+6,i*3+9),v=normal(a,b,c);
  for(let j=0;j<3;j++)partNormals.set(v,(i+j)*3);
 }
 const partNormal=accessor(partNormals,"VEC3",{target:34962});
 const accessories=vehicleAccessories(role,mesh.bounds).map((item,i)=>
  finishVehicleComponent(item,faction,i===0?"wood":"trim"));
 const accessoryMeshes=accessories.map(item=>{
  const positions=accessor(new Float32Array(item.positions),"VEC3",{target:34962});
  const uvs=accessor(new Float32Array(item.uvs),"VEC2",{target:34962});
  const colors=accessor(new Float32Array(item.colors),"VEC4",{target:34962});
  const normalData=new Float32Array(item.positions.length);
  for(let i=0;i<item.count;i+=3){
   const a=item.positions.slice(i*3,i*3+3),
    b=item.positions.slice(i*3+3,i*3+6),
    c=item.positions.slice(i*3+6,i*3+9),face=normal(a,b,c);
   for(let j=0;j<3;j++)normalData.set(face,(i+j)*3);
  }
  const normals=accessor(normalData,"VEC3",{target:34962});
  return {name:item.name,primitives:[{attributes:{POSITION:positions,NORMAL:normals,
   TEXCOORD_0:uvs,COLOR_0:colors},material:0,mode:4}]};
 });
 const animations=[];
 for(const mode of ["idle","walk","attack","hit","death"]){
  const duration=mode==="hit"?.22:mode==="death"?.65:mode==="attack"?.7:mode==="walk"?1.2:2.2;
  const times=new Float32Array(Array.from({length:9},(_,i)=>duration*i/8));
  const translation=[],rotation=[],componentRotation=[],accessoryRotations=[[],[]];
  for(let i=0;i<times.length;i++){
   const motion=vehicleMotion(role,["hit","death"].includes(mode)?"idle":mode,times[i]*1000,0);
   const progress=times[i]/duration;
   // Finite, non-looping physical reaction curves. These remain visual only.
   const kick=mode==="hit"?Math.sin(Math.PI*progress):0;
   const fall=mode==="death"?progress*progress:0;
   translation.push(0,motion.rise-.55*fall-.09*kick,motion.recoil*-1-.17*kick);
   rotation.push(...quaternion(motion.pitch+.19*kick+.85*fall,
    motion.roll+.07*kick+.52*fall,motion.yaw));
   componentRotation.push(...componentQuaternion(part.domain,mode,times[i]));
   for(let j=0;j<2;j++)accessoryRotations[j].push(...accessoryQuaternion(part.domain,j,mode,times[i]));
  }
  const input=accessor(times,"SCALAR",{min:[0],max:[duration]}),
   t=accessor(new Float32Array(translation),"VEC3"),
   r=accessor(new Float32Array(rotation),"VEC4"),
   pr=accessor(new Float32Array(componentRotation),"VEC4"),
   accessoryAccessors=accessoryRotations.map(track=>accessor(new Float32Array(track),"VEC4"));
  animations.push({name:mode,
   samplers:[{input,output:t,interpolation:"LINEAR"},
    {input,output:r,interpolation:"LINEAR"},
    {input,output:pr,interpolation:"LINEAR"},
    ...accessoryAccessors.map(output=>({input,output,interpolation:"LINEAR"}))],
   channels:[{sampler:0,target:{node:0,path:"translation"}},
    {sampler:1,target:{node:0,path:"rotation"}},
    {sampler:2,target:{node:1,path:"rotation"}},
    {sampler:3,target:{node:2,path:"rotation"}},
    {sampler:4,target:{node:3,path:"rotation"}}]});
 }
 const image=ppmToPng(texture);
 const buffer=Buffer.concat(parts);
 return {asset:{version:"2.0",generator:"Crowns of Iron faction-finished vehicle art 10.6"},
  scene:0,scenes:[{nodes:[0]}],nodes:[{name:faction+" "+role,mesh:0,children:[1,2,3]},
   {name:part.domain+" weapon assembly",mesh:1,translation:part.anchor},
   ...accessories.map((item,i)=>({name:item.name,mesh:i+2,translation:item.anchor}))],
  meshes:[{name:role,primitives:[{attributes:{POSITION:position,NORMAL:n,
   TEXCOORD_0:uv,COLOR_0:color},material:0,mode:4}]},
   {name:part.domain+" articulated component",primitives:[{attributes:{
    POSITION:partPosition,NORMAL:partNormal,TEXCOORD_0:partUv,COLOR_0:partColors},
    material:0,mode:4}]},...accessoryMeshes],
  buffers:[{byteLength:buffer.length,uri:"data:application/octet-stream;base64,"+
   buffer.toString("base64")}],bufferViews,accessors,
  materials:[{name:"Vehicle UV material",doubleSided:true,
   pbrMetallicRoughness:{baseColorTexture:{index:0},
    ...roleMaterialProfile(role)}}],
  images:[{uri:"data:image/png;base64,"+image.toString("base64"),
   mimeType:"image/png"}],
  samplers:[{magFilter:9729,minFilter:9728,wrapS:10497,wrapT:10497}],
  textures:[{sampler:0,source:0}],animations,
  extras:{domain:vehicleDomain(role),visualOnly:true,component:part.domain,
   accessories:accessories.map(item=>item.name)}};
}
export async function exportAllVehicles(){
 const palette=parseMtl(await readFile(new URL(
  "../assets/models/crowns-palette.mtl",import.meta.url),"utf8"));
 const exported=[];
 for(const faction of FACTION_SLUGS){
  const texture=refineFactionTexture(parsePpm(await readFile(new URL(
   "../assets/textures/factions/"+faction+".ppm",import.meta.url),"utf8")),faction);
  for(const role of VEHICLE_ROLES){
   const slug=ROLE_SLUGS[role];
   const source=await readFile(new URL("../assets/models/roster/"+
    faction+"/"+slug+".obj",import.meta.url),"utf8");
   const mesh=parseObj(source,palette);
   const doc=exportVehicleGltf(mesh,texture,{faction,role});
   const dest=new URL("../assets/gltf-vehicles/"+faction+"/"+slug+".gltf",import.meta.url);
   await mkdir(new URL("./",dest),{recursive:true});
   await writeFile(dest,JSON.stringify(doc));
   exported.push({faction,role,vertices:mesh.vertexCount,domain:vehicleDomain(role)});
  }
 }
 return exported;
}
if(process.argv[1]&&import.meta.url===new URL("file://"+process.argv[1]).href)
 console.log(JSON.stringify(await exportAllVehicles()));
