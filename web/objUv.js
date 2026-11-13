/** Authored planar UV coordinates exported as standard Wavefront vt + f v/vt.
 * Each polygon receives its own UVs so distinct face orientations don't overlap
 * inadvertently. Textures still bake to RGB vertex colors in the prototype. */
export function addPlanarUvs(obj){
 if(typeof obj!=="string"||obj.length>1500000)throw Error("Invalid OBJ source");
 const lines=obj.split(/\r?\n/);
 const vertices=lines.filter(line=>line.startsWith("v ")).map(line=>
  line.slice(2).trim().split(/\s+/).slice(0,3).map(Number));
 if(!vertices.length||vertices.some(p=>p.length!==3||p.some(n=>!Number.isFinite(n))))
  throw Error("No valid OBJ positions");
 const prefix=lines.filter(line=>line.startsWith("#")||line.startsWith("mtllib ")||
  line.startsWith("o ")||line.startsWith("g "));
 const vt=[],body=[];
 const norm=(a,b,c)=>{
  const u=b.map((n,i)=>n-a[i]),v=c.map((n,i)=>n-a[i]);
  return [u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]];
 };
 const fract=n=>((n%1)+1)%1;
 for(const line of lines){
  if(line.startsWith("usemtl ")){body.push(line);continue;}
  if(!line.startsWith("f "))continue;
  const ids=line.slice(2).trim().split(/\s+/).map(tok=>Number(tok.split("/")[0]));
  if(ids.length<3||ids.length>8||ids.some(id=>!Number.isSafeInteger(id)||id<1||
    id>vertices.length))throw Error("Invalid OBJ face for UV unwrapping");
  const normal=norm(...ids.slice(0,3).map(id=>vertices[id-1]));
  const axis=normal.map(Math.abs).indexOf(Math.max(...normal));
  const [u,v]=axis===0?[2,1]:axis===1?[0,2]:[0,1];
  const refs=ids.map(id=>{
   const p=vertices[id-1],textureId=vt.length+1;
   vt.push("vt "+fract(.5+p[u]*.37).toFixed(6)+" "+fract(.5+p[v]*.37).toFixed(6));
   return id+"/"+textureId;
  });
  body.push("f "+refs.join(" "));
 }
 if(!body.some(s=>s.startsWith("f ")))throw Error("OBJ has no faces");
 return [...prefix,...vertices.map(p=>"v "+p.join(" ")),...vt,...body,""].join("\n");
}
