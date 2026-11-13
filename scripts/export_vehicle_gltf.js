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
 const animations=[];
 for(const mode of ["idle","walk","attack"]){
  const duration=mode==="attack"?.7:mode==="walk"?1.2:2.2;
  const times=new Float32Array(Array.from({length:9},(_,i)=>duration*i/8));
  const translation=[],rotation=[];
  for(let i=0;i<times.length;i++){
   const motion=vehicleMotion(role,mode,times[i]*1000,0);
   translation.push(0,motion.rise,motion.recoil*-1);
   rotation.push(...quaternion(motion.pitch,motion.roll,motion.yaw));
  }
  const input=accessor(times,"SCALAR",{min:[0],max:[duration]}),
   t=accessor(new Float32Array(translation),"VEC3"),
   r=accessor(new Float32Array(rotation),"VEC4");
  animations.push({name:mode,
   samplers:[{input,output:t,interpolation:"LINEAR"},
    {input,output:r,interpolation:"LINEAR"}],
   channels:[{sampler:0,target:{node:0,path:"translation"}},
    {sampler:1,target:{node:0,path:"rotation"}}]});
 }
 const image=ppmToPng(texture);
 const buffer=Buffer.concat(parts);
 return {asset:{version:"2.0",generator:"Crowns of Iron specialized vehicle art 9.9"},
  scene:0,scenes:[{nodes:[0]}],nodes:[{name:faction+" "+role,mesh:0}],
  meshes:[{name:role,primitives:[{attributes:{POSITION:position,NORMAL:n,
   TEXCOORD_0:uv,COLOR_0:color},material:0,mode:4}]}],
  buffers:[{byteLength:buffer.length,uri:"data:application/octet-stream;base64,"+
   buffer.toString("base64")}],bufferViews,accessors,
  materials:[{name:"Vehicle UV material",doubleSided:true,
   pbrMetallicRoughness:{baseColorTexture:{index:0},
    ...roleMaterialProfile(role)}}],
  images:[{uri:"data:image/png;base64,"+image.toString("base64"),
   mimeType:"image/png"}],
  samplers:[{magFilter:9729,minFilter:9728,wrapS:10497,wrapT:10497}],
  textures:[{sampler:0,source:0}],animations,
  extras:{domain:vehicleDomain(role),visualOnly:true}};
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
