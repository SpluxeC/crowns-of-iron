import {createWebGLRenderer} from "/webgl3d.js";
import {MODEL_NAMES,loadObjAssetSet} from "/objLoader.js";
const canvas=document.getElementById("preview"),select=document.getElementById("model");
const details=document.getElementById("details");
const renderer=createWebGLRenderer(canvas,{preview:true});
const archetypes={worker:"Worker",infantry:"Swordsman",ranged:"Archer",hero:"Hero",
 siege:"Battering Ram",ship:"Heavy Warship",air:"Interceptor"};
const buildings={civilian:"Farm",defense:"Stone Wall",tower:"Watchtower"};
const width=12,height=12;
const tiles=Array.from({length:width*height},(_,i)=>({x:i%width,y:Math.floor(i/width),
 terrain:"grass",occupied:null,resource:null}));
const world={width,height,tiles,structures:[]};
let meshes=null,drag=null;
function draw(){
 const name=select.value;
 if(!MODEL_NAMES.includes(name))return;
 const building=!!buildings[name];
 world.structures=building?[{id:"sample",owner:"p0",kind:buildings[name],x:5,y:5,
  width:2,height:2}]:[];
 for(const tile of world.tiles)tile.occupied=building&&
  tile.x>=5&&tile.x<7&&tile.y>=5&&tile.y<7?"sample":null;
 const unit={id:"sample",owner:"p0",archetype:archetypes[name],alive:true,
  hp:100,maxHp:100,x:5,y:5};
 renderer?.draw(world,{viewerId:"p0",players:[{id:"p0",units:building?[]:[unit]}]},new Set());
 const mesh=meshes?.[name];
 details.textContent=mesh?name.toUpperCase()+" · "+mesh.triangles+
  " triangles · "+mesh.vertexCount+" rendered triangle vertices · editable .obj and .mtl":
  "Loading "+name+" — showing fallback until model is available";
}
if(!renderer){details.textContent="WebGL not available in this browser.";}
else renderer.loadAssets({notify:draw}).then(async()=>{
 meshes=await loadObjAssetSet();
 draw();
}).catch(e=>{details.textContent="OBJ load error: "+e.message;draw();});
select.addEventListener("change",draw);
document.getElementById("orbitLeft").addEventListener("click",()=>{renderer?.orbit(-30,0);draw();});
document.getElementById("orbitRight").addEventListener("click",()=>{renderer?.orbit(30,0);draw();});
document.getElementById("zoomIn").addEventListener("click",()=>{renderer?.zoom(-1);draw();});
document.getElementById("zoomOut").addEventListener("click",()=>{renderer?.zoom(1);draw();});
canvas.addEventListener("pointerdown",e=>{drag={x:e.clientX,y:e.clientY};
 canvas.setPointerCapture(e.pointerId);});
canvas.addEventListener("pointermove",e=>{
 if(!drag)return;
 renderer?.orbit(e.clientX-drag.x,e.clientY-drag.y);
 drag={x:e.clientX,y:e.clientY};draw();
});
canvas.addEventListener("pointerup",()=>{drag=null;});
canvas.addEventListener("pointercancel",()=>{drag=null;});
canvas.addEventListener("wheel",e=>{e.preventDefault();renderer?.zoom(Math.sign(e.deltaY));draw();},{passive:false});
draw();
