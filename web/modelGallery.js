import {createWebGLRenderer} from "/webgl3d.js";
import {MODEL_NAMES} from "/objLoader.js";
import {ROSTER_ROLES,roleFamily} from "/rosterArt.js";
import {ALL_SKINNED_ROLES} from "/skinnedRoster.js";
import {VEHICLE_ROLES} from "/vehicleArt.js";
const canvas=document.getElementById("preview"),select=document.getElementById("model");
const details=document.getElementById("details"),
 roleChoice=document.getElementById("unitRole");
for(const role of ROSTER_ROLES){
 const option=document.createElement("option");option.value=role;option.textContent=role;
 roleChoice.append(option);
}
const factionChoice=document.getElementById("faction"),
 clipChoice=document.getElementById("clip");
const renderer=createWebGLRenderer(canvas,{preview:true});
const archetypes={worker:"Worker",infantry:"Swordsman",ranged:"Archer",hero:"Hero",
 siege:"Battering Ram",ship:"Heavy Warship",air:"Interceptor"};
const buildings={civilian:"Farm",defense:"Stone Wall",tower:"Watchtower"};
const width=12,height=12;
const tiles=Array.from({length:width*height},(_,i)=>({x:i%width,y:Math.floor(i/width),
 terrain:"grass",occupied:null,resource:null}));
const world={width,height,tiles,structures:[]};
let drag=null,lastFrame=0,loadMessage="Loading generic models…",
 assetsReady=false,rosterSelectionLoading=false;
async function loadSelectedRoster(){
 const faction=factionChoice.value,role=roleChoice.value;
 if(!renderer||!assetsReady||!role||faction==="base"||rosterSelectionLoading)return;
 if(renderer.rosterMeshInfo(faction,role)&&
   (!ALL_SKINNED_ROLES.includes(role)||renderer.skinnedMeshInfo(faction,role))&&
   (!VEHICLE_ROLES.includes(role)||renderer.vehicleMeshInfo(faction,role)))return;
 rosterSelectionLoading=true;
 try{
  await renderer.loadRosterAssets({requests:[{faction,role}],notify:draw});
  if(ALL_SKINNED_ROLES.includes(role)){
   const skin=await renderer.loadSkinnedAssets({requests:[{faction,role}],notify:draw});
   loadMessage=skin.loaded?"Skinned glTF + PBR source asset ready":"OBJ fallback";
  }else if(VEHICLE_ROLES.includes(role)){
   const vehicle=await renderer.loadVehicleAssets({requests:[{faction,role}],notify:draw});
   loadMessage=vehicle.loaded?"Animated vehicle glTF ready":"Roster OBJ fallback";
  }else loadMessage="Roster OBJ model loaded";
 }catch(error){loadMessage="Roster model fallback: "+error.message;}
 finally{rosterSelectionLoading=false;draw();}
}
function draw(){
 const specificRole=roleChoice.value,
 name=specificRole?roleFamily(specificRole):select.value;
 if(!MODEL_NAMES.includes(name))return;
 const building=!!buildings[name];
 const faction=factionChoice.value==="base"?null:factionChoice.value;
 world.structures=building?[{id:"sample",owner:"p0",kind:buildings[name],x:5,y:5,
  width:2,height:2}]:[];
 for(const tile of world.tiles)tile.occupied=building&&
  tile.x>=5&&tile.x<7&&tile.y>=5&&tile.y<7?"sample":null;
 const unit={id:"sample",owner:"p0",archetype:specificRole||archetypes[name],alive:true,
  hp:100,maxHp:100,x:5,y:5};
 renderer?.draw(world,{viewerId:"p0",elapsedMs:performance.now(),
  players:[{id:"p0",faction,units:building?[]:[unit]}]},new Set(),
  {previewPose:clipChoice.value});
 const roster=!!specificRole&&!!faction,
 mesh=roster?(ALL_SKINNED_ROLES.includes(specificRole)?
  renderer?.skinnedMeshInfo(faction,specificRole):null)??
  (VEHICLE_ROLES.includes(specificRole)?
   renderer?.vehicleMeshInfo(faction,specificRole):null)??
  renderer?.rosterMeshInfo(faction,specificRole):
  renderer?.meshInfo(name,faction);
 details.textContent=mesh?((faction??"Generic")+" "+(specificRole||name)+
  " · "+mesh.triangles+" triangles · "+mesh.vertexCount+
  " vertices · "+clipChoice.value+" pose · "+
  (roster?"Roster-specific UV-mapped OBJ":"Family model")+" · "+loadMessage):
  "Loading "+name+" — showing fallback until model is available";
}
if(!renderer){details.textContent="WebGL not available in this browser.";}
else renderer.loadAssets({notify:draw}).then(()=>{
 loadMessage="Base models loaded";
 draw();
 return renderer.loadFactionAssets({notify:draw});
}).then(value=>{
 loadMessage="All "+value.factionModels+" faction meshes loaded";
 assetsReady=true;draw();void loadSelectedRoster();
}).catch(e=>{
 loadMessage="Using available model fallbacks: "+e.message;draw();
});
select.addEventListener("change",draw);
roleChoice.addEventListener("change",()=>{draw();void loadSelectedRoster();});
factionChoice.addEventListener("change",()=>{draw();void loadSelectedRoster();});
clipChoice.addEventListener("change",draw);
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

/** Display-only loop: pose changes in the gallery do not affect the match. */
function animate(t){
 if(t-lastFrame>=100){lastFrame=t;if(renderer)draw();}
 requestAnimationFrame(animate);
}
requestAnimationFrame(animate);
