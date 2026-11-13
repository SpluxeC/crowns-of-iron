/** WebGL 3D prototype: GPU-shaded block geometry with a mouse-orbit camera. */
const sub=(a,b)=>({x:a.x-b.x,y:a.y-b.y,z:a.z-b.z});
const dot=(a,b)=>a.x*b.x+a.y*b.y+a.z*b.z;
const cross=(a,b)=>({x:a.y*b.z-a.z*b.y,y:a.z*b.x-a.x*b.z,z:a.x*b.y-a.y*b.x});
const norm=v=>{const d=Math.hypot(v.x,v.y,v.z)||1;return {x:v.x/d,y:v.y/d,z:v.z/d};};
export function cameraForMap(width,height,{yaw=.82,pitch=.72,radius=68}={}){
 const target={x:width/2,y:0,z:height/2};
 const eye={x:target.x+radius*Math.cos(pitch)*Math.sin(yaw),
  y:radius*Math.sin(pitch),z:target.z+radius*Math.cos(pitch)*Math.cos(yaw)};
 const forward=norm(sub(target,eye)),right=norm(cross(forward,{x:0,y:1,z:0}));
 return {eye,forward,right,up:norm(cross(right,forward)),yaw,pitch,radius,
   tanHalfFov:Math.tan(58*Math.PI/360)};
}
export function projectWorld(point,width,height,camera){
 const delta=sub(point,camera.eye),depth=dot(delta,camera.forward);
 if(depth<=.1)return null;
 const f=camera.tanHalfFov;
 return {x:width*(.5+dot(delta,camera.right)/(2*depth*f*(width/height))),
  y:height*(.5-dot(delta,camera.up)/(2*depth*f)),depth};
}
export function pickNearestTile(points,x,y,maxDistance=24){
 let best=null,closest=maxDistance*maxDistance;
 for(const p of points){
  if(!p)continue;
  const d=(p.x-x)**2+(p.y-y)**2;
  if(d<closest){closest=d;best={x:p.tileX,y:p.tileY};}
 }
 return best;
}
const TERRAIN={grass:"#4b795e",forest:"#24533e",hill:"#657279",
  water:"#204767",deposit:"#b69a47",unknown:"#192c39"};
/** Stable structural terrain signature; temporary unit movement does not rebuild GPU tiles. */
export function terrainSignature(world){
 let hash=2166136261;
 const mix=value=>{hash=Math.imul(hash^(value&255),16777619)>>>0;};
 const terrain={grass:1,forest:2,hill:3,water:4,deposit:5,unknown:6};
 for(const t of world.tiles){
  mix(terrain[t.terrain]??0);
  mix(t.occupied?1:0);mix(t.resource?1:0);
 }
 mix(world.width);mix(world.height);
 return (hash>>>0).toString(16);
}
export const heightFor=t=>t?.terrain==="hill"?2.2:t?.terrain==="forest"?.75:
 t?.terrain==="water"?-.4:t?.terrain==="unknown"?.02:.12;
/** Intersect the camera ray with each visible grid-column top instead of snapping
 * to projected tile centers; handles raised hills and small zoom levels. */
export function raycastTerrain(cam,px,py,width,height,world){
 const nx=(2*px/width-1)*cam.tanHalfFov*(width/height);
 const ny=(1-2*py/height)*cam.tanHalfFov;
 const dir=norm({x:cam.forward.x+cam.right.x*nx+cam.up.x*ny,
  y:cam.forward.y+cam.right.y*nx+cam.up.y*ny,
  z:cam.forward.z+cam.right.z*nx+cam.up.z*ny});
 if(dir.y>=-.000001)return null;
 let closest=Infinity,best=null;
 for(const t of world.tiles){
  const depth=(heightFor(t)-cam.eye.y)/dir.y;
  if(depth<=0||depth>=closest)continue;
  const x=cam.eye.x+dir.x*depth,z=cam.eye.z+dir.z*depth;
  if(x>=t.x&&x<t.x+1&&z>=t.y&&z<t.y+1){
   closest=depth;best={x:t.x,y:t.y};
  }
 }
 return best;
}
export function unitVisual(unit){
 const air=new Set(["Scout Aircraft","Interceptor","Gunship","Bomber","Air Transport","Aerial Battleship"]);
 const water=new Set(["Raft","Fishing Vessel","Trade Ship","Transport Ship",
  "Light Warship","Heavy Warship","Naval Siege Ship","Legendary Warship"]);
 if(air.has(unit.archetype))return {width:.72,height:.65,offset:1.8};
 if(water.has(unit.archetype))return {width:.84,height:.55,offset:.12};
 if(unit.archetype==="Hero"||unit.category==="Legendary")return {width:.62,height:2,offset:0};
 if(unit.archetype==="Worker")return {width:.32,height:.93,offset:0};
 return {width:.46,height:1.35,offset:0};
}
function rgb(hex){const n=parseInt(hex.slice(1),16);return [(n>>16&255)/255,(n>>8&255)/255,(n&255)/255];}
function cube(out,x,z,width,bottom,top,color){
 const x0=x-width/2,x1=x+width/2,z0=z-width/2,z1=z+width/2,c=rgb(color);
 function face(a,b,d,e,shade){
  for(const p of [a,b,d,a,d,e])out.push(p[0],p[1],p[2],
   c[0]*shade,c[1]*shade,c[2]*shade);
 }
 face([x0,top,z0],[x1,top,z0],[x1,top,z1],[x0,top,z1],1);
 face([x0,bottom,z0],[x1,bottom,z0],[x1,top,z0],[x0,top,z0],.55);
 face([x1,bottom,z0],[x1,bottom,z1],[x1,top,z1],[x1,top,z0],.66);
 face([x1,bottom,z1],[x0,bottom,z1],[x0,top,z1],[x1,top,z1],.73);
 face([x0,bottom,z1],[x0,bottom,z0],[x0,top,z0],[x0,top,z1],.81);
}
function shader(gl,type,source){
 const value=gl.createShader(type);gl.shaderSource(value,source);gl.compileShader(value);
 if(!gl.getShaderParameter(value,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(value));
 return value;
}
export function createWebGLRenderer(canvas){
 const gl=canvas.getContext("webgl2",{antialias:true,alpha:false})||
  canvas.getContext("webgl",{antialias:true,alpha:false});
 if(!gl)return null;
 const vert=shader(gl,gl.VERTEX_SHADER,`
attribute vec3 a_position;
attribute vec3 a_color;
uniform vec3 u_eye;
uniform vec3 u_right;
uniform vec3 u_up;
uniform vec3 u_forward;
uniform float u_tan;
uniform float u_aspect;
varying vec3 v_color;
void main(){
 vec3 d=a_position-u_eye;
 float depth=max(dot(d,u_forward),.1);
 float nearPlane=0.1;
 float farPlane=350.0;
 float clipZ=depth*(farPlane+nearPlane)/(farPlane-nearPlane)-
  (2.0*farPlane*nearPlane)/(farPlane-nearPlane);
 // Homogeneous perspective division happens after vertex shading.
 gl_Position=vec4(dot(d,u_right)/(u_tan*u_aspect),
  dot(d,u_up)/u_tan,clipZ,depth);
 v_color=a_color;
}`);
 const frag=shader(gl,gl.FRAGMENT_SHADER,`
precision mediump float;
varying vec3 v_color;
void main(){gl_FragColor=vec4(v_color,1.0);}
`);
 const program=gl.createProgram();gl.attachShader(program,vert);gl.attachShader(program,frag);
 gl.linkProgram(program);
 if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));
 const position=gl.getAttribLocation(program,"a_position"),color=gl.getAttribLocation(program,"a_color");
 const uniforms=Object.fromEntries(["u_eye","u_right","u_up","u_forward","u_tan","u_aspect"]
  .map(k=>[k,gl.getUniformLocation(program,k)]));
 const staticBuffer=gl.createBuffer(),dynamicBuffer=gl.createBuffer();
 gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);
 let yaw=.82,pitch=.72,radius=68,worldForPick=null,camForPick=null,
  terrainKey=null,terrainVertexCount=0,rebuilds=0;
 function drawBuffer(buffer,count){
  gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
  gl.enableVertexAttribArray(position);gl.vertexAttribPointer(position,3,gl.FLOAT,false,24,0);
  gl.enableVertexAttribArray(color);gl.vertexAttribPointer(color,3,gl.FLOAT,false,24,12);
  gl.drawArrays(gl.TRIANGLES,0,count);
 }
 return {
  draw(world,match,selectedUnits){
   const cam=cameraForMap(world.width,world.height,{yaw,pitch,radius});
   worldForPick=world;camForPick=cam;
   const key=terrainSignature(world);
   if(key!==terrainKey){
    const verts=[];
    for(const t of world.tiles){
    const base=heightFor(t);
    cube(verts,t.x+.5,t.y+.5,1,-.65,base,TERRAIN[t.terrain]??"#4b795e");
    if(t.resource&&t.terrain==="deposit")
     cube(verts,t.x+.5,t.y+.5,.47,base,base+.3,"#dec57a");
    if(t.terrain==="forest")
     cube(verts,t.x+.5,t.y+.5,.30,base,base+1.6,"#9d8156");
    if(t.occupied)cube(verts,t.x+.5,t.y+.5,.84,base,base+2.4,"#c2baa7");
    }
    const data=new Float32Array(verts);
    gl.bindBuffer(gl.ARRAY_BUFFER,staticBuffer);
    gl.bufferData(gl.ARRAY_BUFFER,data,gl.STATIC_DRAW);
    terrainVertexCount=data.length/6;terrainKey=key;rebuilds++;
   }
   const verts=[];
   for(const [i,p] of match.players.entries())for(const u of p.units.filter(
      u=>u.alive&&Number.isInteger(u.x)&&!u.embarkedAt&&!u.garrisonedAt)){
    const terrain=world.tiles[u.y*world.width+u.x],base=heightFor(terrain);
    const style=unitVisual(u),bottom=base+style.offset;
    if(selectedUnits.has(u.id))
      cube(verts,u.x+.5,u.y+.5,.76,base,base+.10,"#fce57d");
    cube(verts,u.x+.5,u.y+.5,style.width,bottom,bottom+style.height,
     selectedUnits.has(u.id)?"#fce57d":i===0?"#c5eeff":"#f58a7c");
   }
   const data=new Float32Array(verts);
   gl.viewport(0,0,canvas.width,canvas.height);
   gl.clearColor(.06,.12,.19,1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
   gl.useProgram(program);
   gl.bindBuffer(gl.ARRAY_BUFFER,dynamicBuffer);
   gl.bufferData(gl.ARRAY_BUFFER,data,gl.DYNAMIC_DRAW);
   for(const k of ["eye","right","up","forward"]){
    const p=cam[k];gl.uniform3f(uniforms["u_"+k],p.x,p.y,p.z);
   }
   gl.uniform1f(uniforms.u_tan,cam.tanHalfFov);
   gl.uniform1f(uniforms.u_aspect,canvas.width/canvas.height);
   drawBuffer(staticBuffer,terrainVertexCount);
   drawBuffer(dynamicBuffer,data.length/6);
  },
  pick(px,py){return camForPick&&worldForPick
    ?raycastTerrain(camForPick,px,py,canvas.width,canvas.height,worldForPick):null},
  orbit(dx,dy){yaw+=dx*.009;pitch=Math.max(.22,Math.min(1.37,pitch+dy*.008));},
  zoom(direction){radius=Math.max(30,Math.min(125,radius+direction*5));},
  camera(){return {yaw,pitch,radius};},
  stats(){return {terrainRebuilds:rebuilds,terrainVertices:terrainVertexCount};},
  dispose(){
   gl.deleteBuffer(staticBuffer);gl.deleteBuffer(dynamicBuffer);
   gl.deleteProgram(program);gl.deleteShader(vert);gl.deleteShader(frag);
  }
 };
}
