/** glTF 2.0 exporter: genuine seven-joint skin, inverse bind matrices,
 * JOINTS_0/WEIGHTS_0, animated quaternion rotation channels and embedded PNG.
 * Six selected humanoid roles for each faction; source OBJ remains editable.
 */
import {readFile,writeFile,mkdir} from "node:fs/promises";
import {deflateSync} from "node:zlib";
import {parseMtl,parseObj} from "../web/objLoader.js";
import {parsePpm} from "../web/factionTextures.js";
import {FACTION_SLUGS} from "../web/factionArt.js";
import {SKINNED_ROLES,skinnedRoleSlug} from "../web/skinnedRoster.js";
import {RIG_BONE_NAMES,rigForFaction,boneForPosition} from "../web/rigProfiles.js";
import {ANIMATION_CLIPS} from "../web/animationClips.js";
import {refineFactionTexture,roleMaterialProfile} from "../web/materialDetail.js";
const ALIGN=4;
function crc32(data){
 let crc=0xffffffff;
 for(const byte of data){crc^=byte;for(let j=0;j<8;j++)
  crc=(crc>>>1)^((crc&1)?0xedb88320:0);}
 return (crc^0xffffffff)>>>0;
}
function chunk(name,data){
 const payload=Buffer.from(data),b=Buffer.alloc(12+payload.length);
 b.writeUInt32BE(payload.length,0);b.write(name,4,4,"ascii");
 payload.copy(b,8);b.writeUInt32BE(crc32(b.subarray(4,8+payload.length)),8+payload.length);
 return b;
}
export function ppmToPng(image){
 if(image.width>256||image.height>256)throw Error("Texture exceeds export budget");
 const stride=image.width*4,raw=Buffer.alloc((stride+1)*image.height);
 for(let y=0;y<image.height;y++){
  const start=y*(stride+1);raw[start]=0;
  for(let x=0;x<image.width;x++){
   const src=(y*image.width+x)*3,dst=start+1+x*4;
   raw[dst]=image.pixels[src];raw[dst+1]=image.pixels[src+1];
   raw[dst+2]=image.pixels[src+2];raw[dst+3]=255;
  }
 }
 const ihdr=Buffer.alloc(13);ihdr.writeUInt32BE(image.width,0);
 ihdr.writeUInt32BE(image.height,4);ihdr[8]=8;ihdr[9]=6;
 return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),
  chunk("IHDR",ihdr),chunk("IDAT",deflateSync(raw,{level:9})),chunk("IEND",[])]);
}
function triangleNormals(vertices){
 const normals=new Float32Array(vertices.length/2);
 for(let i=0;i<vertices.length;i+=18){
  const a=vertices.slice(i,i+3),b=vertices.slice(i+6,i+9),
   c=vertices.slice(i+12,i+15);
  const p=b.map((x,j)=>x-a[j]),q=c.map((x,j)=>x-a[j]);
  const n=[p[1]*q[2]-p[2]*q[1],p[2]*q[0]-p[0]*q[2],
   p[0]*q[1]-p[1]*q[0]];
  const l=Math.hypot(...n)||1;
  for(let k=0;k<3;k++)normals.set(n.map(v=>v/l),(i/6+k)*3);
 }
 return normals;
}
function makeMatrixInverse(pos){
 return [1,0,0,0,0,1,0,0,0,0,1,0,-pos[0],-pos[1],-pos[2],1];
}
function quaternionX(angle){return [Math.sin(angle/2),0,0,Math.cos(angle/2)];}
export function exportSkinnedGltf(mesh,rig,clips,texture,
 {name="Infantry",role="Swordsman"}={}){
 const count=mesh.vertexCount;
 if(count<3||count>20000||mesh.uvs.length!==count*2||!mesh.textured)
  throw Error("Valid UV mapped OBJ mesh required");
 const positions=new Float32Array(count*3),colors=new Float32Array(count*4);
 for(let i=0;i<count;i++){
  positions.set(mesh.vertices.slice(i*6,i*6+3),i*3);
  colors.set([mesh.vertices[i*6+3],mesh.vertices[i*6+4],
   mesh.vertices[i*6+5],1],i*4);
 }
 const maxY=Math.max(.1,mesh.bounds.max[1]);
 const joints=new Uint16Array(count*4),weights=new Float32Array(count*4);
 for(let i=0;i<count;i++){
  const [x,y]=positions.slice(i*3,i*3+2);
  const primary=Math.max(0,RIG_BONE_NAMES.indexOf(
   boneForPosition(x,y,maxY,rig)));
  const spine=RIG_BONE_NAMES.indexOf("spine");
  const blend=primary===spine?0:
   Math.max(.08,Math.min(.30,.18+.12*Math.abs(y/maxY-.52)));
  joints[i*4]=primary;
  joints[i*4+1]=primary===spine?0:spine;
  weights[i*4]=1-blend;
  weights[i*4+1]=blend;
 }
 const jointsRest=RIG_BONE_NAMES.map(bone=>{
  if(bone==="root")return [0,0,0];
  if(bone==="spine")return [0,rig.hipY*maxY,0];
  if(bone==="head")return [0,rig.headY*maxY,0];
  if(bone==="leftArm")return [-rig.shoulderWidth,rig.shoulderY*maxY,0];
  if(bone==="rightArm")return [rig.shoulderWidth,rig.shoulderY*maxY,0];
  if(bone==="leftLeg")return [-rig.hipWidth,rig.hipY*maxY,0];
  return [rig.hipWidth,rig.hipY*maxY,0];
 });
 const inverse=new Float32Array(jointsRest.flatMap(makeMatrixInverse));
 const views=[],accessors=[],parts=[];
 let offset=0;
 function accessor(data,type,componentType,{min,max,target}={}){
  const bytes=Buffer.from(data.buffer,data.byteOffset,data.byteLength);
  const pad=(ALIGN-(offset%ALIGN))%ALIGN;
  if(pad){parts.push(Buffer.alloc(pad));offset+=pad;}
  const view=views.length;views.push({buffer:0,byteOffset:offset,
   byteLength:bytes.length,...(target?{target}:{})});
  parts.push(bytes);offset+=bytes.length;
  const tuple={SCALAR:1,VEC2:2,VEC3:3,VEC4:4,MAT4:16}[type];
  const index=accessors.length;
  accessors.push({bufferView:view,componentType,count:data.length/tuple,type,
   ...(min?{min}:{}),...(max?{max}:{})});
  return index;
 }
 const normal=triangleNormals(mesh.vertices);
 const pos=accessor(positions,"VEC3",5126,{min:mesh.bounds.min,max:mesh.bounds.max,target:34962});
 const nor=accessor(normal,"VEC3",5126,{target:34962});
 const uv=accessor(mesh.uvs,"VEC2",5126,{target:34962});
 const col=accessor(colors,"VEC4",5126,{target:34962});
 const joint=accessor(joints,"VEC4",5123,{target:34962});
 const weight=accessor(weights,"VEC4",5126,{target:34962});
 const ibm=accessor(inverse,"MAT4",5126);
 const animations=[];
 for(const [clipName,clip] of Object.entries(clips)){
  const times=new Float32Array(clip.keyframes.map(k=>k.t*clip.durationMs/1000));
  const input=accessor(times,"SCALAR",5126,{min:[0],max:[clip.durationMs/1000]});
  const samplers=[],channels=[];
  for(let bone=1;bone<RIG_BONE_NAMES.length;bone++){
   const b=RIG_BONE_NAMES[bone];
   const rotations=new Float32Array(clip.keyframes.flatMap(
    k=>quaternionX(k.angles[b])));
   const output=accessor(rotations,"VEC4",5126);
   const sampler=samplers.length;samplers.push({input,output,interpolation:"LINEAR"});
   channels.push({sampler,target:{node:bone+1,path:"rotation"}});
  }
  animations.push({name:clipName,samplers,channels});
 }
 const image=ppmToPng(texture);
 const buffer=Buffer.concat(parts);
 const nodes=[{name:"Skinned "+name,mesh:0,skin:0},
  ...RIG_BONE_NAMES.map((bone,i)=>({
   name:bone,translation:jointsRest[i],...(i===0?{children:[3,4,5,6,7,2]}:{})
  }))];
 const doc={asset:{version:"2.0",generator:"Crowns of Iron procedural skin exporter 8.7"},
  scene:0,scenes:[{nodes:[0,1]}],nodes,skins:[{name:"SevenJointRig",
   inverseBindMatrices:ibm,joints:[1,2,3,4,5,6,7],skeleton:1}],
  meshes:[{name,primitives:[{attributes:{POSITION:pos,NORMAL:nor,
   TEXCOORD_0:uv,COLOR_0:col,JOINTS_0:joint,WEIGHTS_0:weight},
   material:0,mode:4}]}],
  buffers:[{byteLength:buffer.length,uri:"data:application/octet-stream;base64,"+
    buffer.toString("base64")}],
  bufferViews:views,accessors,
  materials:[{name:"Faction PBR baseColor",doubleSided:true,
   pbrMetallicRoughness:{baseColorTexture:{index:0},
    ...roleMaterialProfile(role)}}],
  images:[{uri:"data:image/png;base64,"+image.toString("base64"),
   mimeType:"image/png"}],samplers:[{magFilter:9729,minFilter:9987,
   wrapS:10497,wrapT:10497}],textures:[{sampler:0,source:0}],animations};
 return doc;
}
/** Regenerate all skinned assets from exactly the six selected roles per faction. */
export async function exportSkinnedRoster(roles=SKINNED_ROLES){
 if(!Array.isArray(roles)||roles.some(role=>!SKINNED_ROLES.includes(role)))
  throw Error("Unrecognized skinned role export request");
 const palette=parseMtl(await readFile(
  new URL("../assets/models/crowns-palette.mtl",import.meta.url),"utf8"));
 const result=[];
 for(const faction of FACTION_SLUGS){
  const texture=refineFactionTexture(parsePpm(await readFile(new URL(
   "../assets/textures/factions/"+faction+".ppm",import.meta.url),"utf8")),faction);
  for(const role of roles){
   const slug=skinnedRoleSlug(role);
   const source=await readFile(new URL(
    "../assets/models/roster/"+faction+"/"+slug+".obj",import.meta.url),"utf8");
   const mesh=parseObj(source,palette);
   const doc=exportSkinnedGltf(mesh,rigForFaction(faction),
    ANIMATION_CLIPS,texture,{name:faction+" "+role,role});
   const url=new URL("../assets/gltf/"+faction+"/"+slug+".gltf",import.meta.url);
   await mkdir(new URL("./",url),{recursive:true});
   await writeFile(url,JSON.stringify(doc));
   result.push({faction,role,vertices:mesh.vertexCount,
    joints:doc.skins[0].joints.length,clips:doc.animations.length});
  }
 }
 return result;
}
/** Backwards compatibility for the previous milestone's Swordsman-only helper. */
export async function exportFactionInfantry(){
 return exportSkinnedRoster(["Swordsman"]);
}
if(process.argv[1]&&import.meta.url===new URL("file://"+process.argv[1]).href)
 console.log(JSON.stringify(await exportSkinnedRoster()));
