import {factionSlug} from "./factionArt.js";
import {skinnedGltfPath,skinnedRoleSlug} from "./skinnedRoster.js";
/** Strict same-origin glTF 2.0 skin loader. This prototype CPU-skins positions;
 * embedded PBR textures are retained in glTF for external viewers, while the
 * current RTS renderer still uses baked UV vertex colors. */
const COMPONENT_BYTES={5123:2,5126:4};
const TYPE_COUNT={SCALAR:1,VEC2:2,VEC3:3,VEC4:4,MAT4:16};
function decodeBase64(uri){
 if(typeof uri!=="string"||!/^data:application\/octet-stream;base64,[A-Za-z0-9+/=]+$/.test(uri))
  throw Error("External glTF buffers are disallowed");
 const bytes=atob(uri.slice(uri.indexOf(",")+1));
 if(bytes.length>5_000_000)throw Error("glTF buffer exceeds budget");
 return Uint8Array.from(bytes,c=>c.charCodeAt(0));
}
export function validateSkinnedGltf(doc){
 if(doc?.asset?.version!=="2.0"||!Array.isArray(doc.buffers)||
  doc.buffers.length!==1||doc.meshes?.length!==1||doc.skins?.length!==1)
  throw Error("Unsupported skinned glTF layout");
 const buffer=decodeBase64(doc.buffers[0].uri);
 if(buffer.length!==doc.buffers[0].byteLength)throw Error("glTF buffer size mismatch");
 const joints=doc.skins[0].joints;
 if(joints.length!==7||!Array.isArray(doc.animations)||doc.animations.length!==3)
  throw Error("Incomplete seven-joint animation rig");
 const primitive=doc.meshes[0].primitives?.[0],attrs=primitive?.attributes;
 if(primitive?.mode!==4||!attrs||!
  ["POSITION","NORMAL","TEXCOORD_0","COLOR_0","JOINTS_0","WEIGHTS_0"]
   .every(k=>Number.isInteger(attrs[k])))throw Error("Incomplete glTF mesh attributes");
 function readAccessor(index){
  const a=doc.accessors?.[index],view=doc.bufferViews?.[a?.bufferView];
  const columns=TYPE_COUNT[a?.type],bytes=COMPONENT_BYTES[a?.componentType];
  if(!columns||!bytes||!Number.isSafeInteger(a?.count)||a.count<1||
    a.count>20000||!view||view.buffer!==0)throw Error("Invalid glTF accessor");
  const offset=(view.byteOffset??0)+(a.byteOffset??0),length=a.count*columns*bytes;
  if(offset<0||offset+length>buffer.length||
   length>view.byteLength-(a.byteOffset??0))throw Error("Out of bounds glTF accessor");
  const dv=new DataView(buffer.buffer,buffer.byteOffset+offset,length);
  const array=[];
  for(let i=0;i<a.count*columns;i++)
   array.push(a.componentType===5126?dv.getFloat32(i*4,true):dv.getUint16(i*2,true));
  if(array.some(v=>!Number.isFinite(v)))throw Error("Invalid glTF data");
  return array;
 }
 const positions=readAccessor(attrs.POSITION),colors=readAccessor(attrs.COLOR_0),
  uv=readAccessor(attrs.TEXCOORD_0),bones=readAccessor(attrs.JOINTS_0),
  weights=readAccessor(attrs.WEIGHTS_0),inverse=readAccessor(doc.skins[0].inverseBindMatrices);
 const count=positions.length/3;
 if(colors.length!==count*4||uv.length!==count*2||bones.length!==count*4||
  weights.length!==count*4||inverse.length!==7*16)throw Error("Invalid glTF attribute lengths");
 for(let i=0;i<count;i++){
  if(bones.slice(i*4,i*4+4).some((j,k)=>j>=7&&weights[i*4+k]>0)||
   weights.slice(i*4,i*4+4).some(v=>v<0||v>1)||
   Math.abs(weights.slice(i*4,i*4+4).reduce((a,b)=>a+b,0)-1)>1e-4)
   throw Error("Invalid glTF skin vertex");
 }
 const clips={};
 for(const animation of doc.animations){
  if(!["idle","walk","attack"].includes(animation.name)||clips[animation.name])
   throw Error("Invalid glTF clip name");
  const channels=animation.channels.map(channel=>{
   const sampler=animation.samplers[channel.sampler];
   if(!sampler||sampler.interpolation!=="LINEAR"||channel.target.path!=="rotation"||
     !joints.includes(channel.target.node))throw Error("Invalid glTF rotation channel");
   return {bone:joints.indexOf(channel.target.node),
    times:readAccessor(sampler.input),rotations:readAccessor(sampler.output)};
  });
  clips[animation.name]=channels;
 }
 if(Object.keys(clips).length!==3)throw Error("Missing glTF animation clips");
 const pivots=joints.map(node=>{
  const translation=doc.nodes[node]?.translation;
  if(!translation||translation.length!==3||
   translation.some(v=>!Number.isFinite(v)))throw Error("Missing joint pivot");
  return translation;
 });
 return {count,positions,colors,uv,bones,weights,pivots,clips,
  material:doc.materials?.[0]??null,
  textureEmbedded:typeof doc.images?.[0]?.uri==="string"&&
   doc.images[0].uri.startsWith("data:image/png;base64,")};
}
function rotate(v,q){
 const [qx,qy,qz,qw]=q;
 const t=[2*(qy*v[2]-qz*v[1]),2*(qz*v[0]-qx*v[2]),2*(qx*v[1]-qy*v[0])];
 return [v[0]+qw*t[0]+qy*t[2]-qz*t[1],
  v[1]+qw*t[1]+qz*t[0]-qx*t[2],
  v[2]+qw*t[2]+qx*t[1]-qy*t[0]];
}
export function sampleSkinnedGltf(model,clip="idle",timeMs=0){
 if(!Number.isFinite(timeMs))throw Error("Invalid glTF animation time");
 const channels=model.clips[clip];
 if(!channels)throw Error("Unknown glTF clip");
 const poses=Array.from({length:7},()=>[0,0,0,1]);
 for(const channel of channels){
  const duration=channel.times.at(-1);
  const time=duration>0?((timeMs/1000%duration)+duration)%duration:0;
  let i=0;
  while(i+1<channel.times.length-1&&time>channel.times[i+1])i++;
  const dt=channel.times[i+1]-channel.times[i],blend=dt>0?
   Math.max(0,Math.min(1,(time-channel.times[i])/dt)):0;
  const a=channel.rotations.slice(i*4,i*4+4),
   b=channel.rotations.slice((i+1)*4,(i+2)*4);
  const q=a.map((v,j)=>v+(b[j]-v)*blend),norm=Math.hypot(...q)||1;
  poses[channel.bone]=q.map(v=>v/norm);
 }
 const result=new Float32Array(model.count*6);
 let min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity];
 for(let i=0;i<model.count;i++){
  const original=model.positions.slice(i*3,i*3+3);
  const pos=[0,0,0];
  for(let influence=0;influence<4;influence++){
   const weight=model.weights[i*4+influence];
   if(weight<=0)continue;
   const joint=model.bones[i*4+influence],pivot=model.pivots[joint],
    v=original.map((p,j)=>p-pivot[j]),rotated=rotate(v,poses[joint]);
   for(let k=0;k<3;k++)pos[k]+=(rotated[k]+pivot[k])*weight;
  }
  for(let k=0;k<3;k++){result[i*6+k]=pos[k];
   min[k]=Math.min(min[k],pos[k]);max[k]=Math.max(max[k],pos[k]);}
  result.set(model.colors.slice(i*4,i*4+3),i*6+3);
 }
 return {vertices:result,uvs:new Float32Array(model.uv),vertexCount:model.count,
  triangles:model.count/3,textured:true,bounds:{min,max},skinned:true};
}
export function createSkinnedGltfLoader(fetcher=fetch){
 const cache=new Map(),pending=new Map();
 async function load(faction,role="Swordsman"){
  const path=skinnedGltfPath(faction,role);
  if(!path)throw Error("Invalid glTF faction or role");
  if(cache.has(path))return cache.get(path);
  if(pending.has(path))return pending.get(path);
  const task=(async()=>{
   const response=await fetcher(path);
   if(!response.ok)throw Error("Skinned glTF unavailable");
   const text=await response.text();
   if(text.length>8_000_000)throw Error("Skinned glTF too large");
   const model=validateSkinnedGltf(JSON.parse(text));
   cache.set(path,model);return model;
  })().finally(()=>pending.delete(path));
  pending.set(path,task);return task;
 }
 return {load,get(faction,role="Swordsman"){
   return cache.get(skinnedGltfPath(faction,role))??null;
  },
  stats(){return {loaded:cache.size,pending:pending.size}}};
}
