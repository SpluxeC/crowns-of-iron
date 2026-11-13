import {vehicleGltfPath} from "./vehicleArt.js";
/** Strict, self-contained glTF mesh-node animation runtime for vehicles;
 * deliberately distinct from seven-joint humanoid skinning. */
const counts={SCALAR:1,VEC2:2,VEC3:3,VEC4:4};
function readBuffer(uri){
 if(!/^data:application\/octet-stream;base64,[a-zA-Z0-9+/=]+$/.test(uri??""))
  throw Error("External vehicle buffers are not allowed");
 const raw=atob(uri.slice(uri.indexOf(",")+1));
 if(raw.length>5_000_000)throw Error("Vehicle glTF exceeds buffer budget");
 return Uint8Array.from(raw,letter=>letter.charCodeAt(0));
}
export function parseVehicleGltf(doc){
 if(doc?.asset?.version!=="2.0"||doc.buffers?.length!==1||
  doc.meshes?.length!==1||doc.nodes?.length!==1||doc.skins!==undefined||
  doc.animations?.length!==5)throw Error("Invalid specialized vehicle glTF");
 const bytes=readBuffer(doc.buffers[0].uri);
 if(bytes.length!==doc.buffers[0].byteLength)throw Error("Vehicle buffer size mismatch");
 function accessor(index){
  const a=doc.accessors?.[index],view=doc.bufferViews?.[a?.bufferView];
  const size=counts[a?.type];
  if(!view||view.buffer!==0||a.componentType!==5126||
   !size||!Number.isInteger(a.count)||a.count<1||a.count>30000)
   throw Error("Invalid vehicle accessor");
  const offset=(view.byteOffset??0)+(a.byteOffset??0),length=a.count*size*4;
  if(offset<0||length>view.byteLength-(a.byteOffset??0)||
   offset+length>bytes.length)throw Error("Vehicle accessor out of range");
  const data=new DataView(bytes.buffer,bytes.byteOffset+offset,length);
  return Array.from({length:a.count*size},(_,i)=>data.getFloat32(i*4,true));
 }
 const prim=doc.meshes[0].primitives?.[0],attr=prim?.attributes;
 if(prim?.mode!==4||!attr||!["POSITION","NORMAL","TEXCOORD_0","COLOR_0"]
  .every(key=>Number.isInteger(attr[key])))throw Error("Invalid vehicle geometry");
 const positions=accessor(attr.POSITION),uvs=accessor(attr.TEXCOORD_0),
  colors=accessor(attr.COLOR_0);
 const count=positions.length/3;
 if(count>20000||count%3!==0||colors.length!==count*4||uvs.length!==count*2)
  throw Error("Invalid vehicle vertex count");
 const animations={};
 for(const clip of doc.animations){
  if(!["idle","walk","attack","hit","death"].includes(clip.name)||animations[clip.name]||
   clip.channels?.length!==2)throw Error("Invalid vehicle clip");
  const curves={};
  for(const channel of clip.channels){
   const sampler=clip.samplers?.[channel.sampler],target=channel.target.path;
   if(channel.target.node!==0||sampler?.interpolation!=="LINEAR"||
    !["translation","rotation"].includes(target)||curves[target])
    throw Error("Invalid vehicle track");
   const times=accessor(sampler.input),values=accessor(sampler.output),
    dimension=target==="rotation"?4:3;
   if(times.length<2||values.length!==times.length*dimension||
    times.some((v,i)=>i>0&&v<=times[i-1]))
    throw Error("Invalid vehicle keyframe order");
   curves[target]={times,values,dimension};
  }
  if(!curves.rotation||!curves.translation)throw Error("Missing vehicle animation track");
  animations[clip.name]=curves;
 }
 if(Object.keys(animations).length!==5)throw Error("Missing vehicle animation");
 return {count,positions,uvs,colors,animations,textured:true,
  embeddedPng:doc.images?.[0]?.uri?.startsWith("data:image/png;base64,")===true};
}
function evaluate(track,clockMs,loop=true){
 const {times,values,dimension}=track,last=times.at(-1);
 const seconds=loop?((clockMs/1000%last)+last)%last:
  Math.max(0,Math.min(last,clockMs/1000));
 let index=0;
 while(index+1<times.length-1&&seconds>times[index+1])index++;
 const denom=times[index+1]-times[index],
  alpha=denom>0?Math.max(0,Math.min(1,(seconds-times[index])/denom)):0;
 const valuesAt=Array.from({length:dimension},(_,k)=>
  values[index*dimension+k]*(1-alpha)+values[(index+1)*dimension+k]*alpha);
 if(dimension===4){const n=Math.hypot(...valuesAt)||1;return valuesAt.map(v=>v/n);}
 return valuesAt;
}
function rotate(point,[qx,qy,qz,qw]){
 const [x,y,z]=point;
 const tx=2*(qy*z-qz*y),ty=2*(qz*x-qx*z),tz=2*(qx*y-qy*x);
 return [x+qw*tx+qy*tz-qz*ty,y+qw*ty+qz*tx-qx*tz,
  z+qw*tz+qx*ty-qy*tx];
}
export function sampleVehicleGltf(model,mode="idle",timeMs=0){
 const curves=model?.animations?.[mode];
 if(!curves||!Number.isFinite(timeMs))throw Error("Invalid vehicle animation sample");
 const loop=mode!=="hit"&&mode!=="death",
  translation=evaluate(curves.translation,timeMs,loop),
  quat=evaluate(curves.rotation,timeMs,loop),
  vertices=new Float32Array(model.count*6);
 const min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity];
 for(let i=0;i<model.count;i++){
  const src=model.positions.slice(i*3,i*3+3),r=rotate(src,quat);
  for(let k=0;k<3;k++){const v=r[k]+translation[k];
   vertices[i*6+k]=v;min[k]=Math.min(min[k],v);max[k]=Math.max(max[k],v);}
  vertices.set(model.colors.slice(i*4,i*4+3),i*6+3);
 }
 return {vertices,uvs:new Float32Array(model.uvs),
  vertexCount:model.count,triangles:model.count/3,
  bounds:{min,max},textured:true,vehicleAnimated:true};
}
export function createVehicleGltfLoader(fetcher=fetch){
 const cache=new Map(),pending=new Map();
 async function load(faction,role){
  const path=vehicleGltfPath(faction,role);
  if(!path)throw Error("Unsupported vehicle art identity");
  if(cache.has(path))return cache.get(path);
  if(pending.has(path))return pending.get(path);
  const work=(async()=>{
   const res=await fetcher(path);
   if(!res.ok)throw Error("Vehicle glTF unavailable");
   const source=await res.text();
   if(source.length>8_000_000)throw Error("Vehicle glTF response too large");
   const model=parseVehicleGltf(JSON.parse(source));
   cache.set(path,model);return model;
  })().finally(()=>pending.delete(path));
  pending.set(path,work);return work;
 }
 return {load,get(faction,role){return cache.get(vehicleGltfPath(faction,role))??null;},
  stats(){return {loaded:cache.size,pending:pending.size}}};
}
