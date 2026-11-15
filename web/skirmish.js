/** GitHub Pages single-player shell; multiplayer browser client is untouched. */
import {createWebGLRenderer,heightFor} from "./webgl3d.js";
import {createRtsCamera,sampleTerrain,edgeAxis,RTS_CAMERA} from "./rtsCamera.js";
const $=id=>document.getElementById(id);
const canvas=$("map3d");
const worker=new Worker(new URL("./skirmishWorker.js",import.meta.url),{type:"module"});
let state=null,selected=new Set(),tool="select",paused=false,speed=1,
 renderer=null,loading3d=false,panning=null,focusInitial=true,
 selectedStructure=null,edgePointer=null,rotationHeld=false,altDown=false;
const camera=createRtsCamera();
let previousFrame=0,lastRender=0;
const log=message=>{const area=$("messages");
 area.textContent=(new Date().toLocaleTimeString()+"  "+message+"\n"+area.textContent).slice(0,3200);};
const order=action=>worker.postMessage({type:"order",order:action});
function db(){return new Promise((resolve,reject)=>{
 const r=indexedDB.open("crowns-of-iron-solo",1);
 r.onupgradeneeded=()=>r.result.createObjectStore("saves");
 r.onerror=()=>reject(r.error);r.onsuccess=()=>resolve(r.result);
});}
async function stored(mode,value){
 const database=await db();
 try{return await new Promise((resolve,reject)=>{
  const tx=database.transaction("saves",mode==="read"?"readonly":"readwrite");
  const req=mode==="read"?tx.objectStore("saves").get("autosave"):
   tx.objectStore("saves").put(value,"autosave");
  req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);
 });}finally{database.close();}
}
function refreshSelect(element,rows,label,getLabel){
 const prior=element.value;
 element.replaceChildren();
 if(!rows.length){const opt=document.createElement("option");opt.textContent=label;
  opt.value="";element.append(opt);element.disabled=true;return;}
 element.disabled=false;
 for(let i=0;i<rows.length;i++){
  const option=document.createElement("option");option.value=String(i);
  option.textContent=getLabel(rows[i]);element.append(option);
 }
 if([...element.options].some(x=>x.value===prior))element.value=prior;
}
let choices={training:[],research:[],buildings:[]};
function updateSidebar(s){
 const me=s.players[0],empire=$("empire");
 empire.textContent=s.faction+" · Age "+s.age+" · Population "+s.popUsed+"/"+s.popCap+
  " · "+Math.floor(s.elapsedMs/60000)+"m "+Math.floor(s.elapsedMs/1000)%60+"s"+
  " · "+Math.max(0,Math.ceil((s.skirmishLimitMs-s.elapsedMs)/60000))+" min to score victory";
 const resources=$("resources");resources.replaceChildren();
 for(const [name,value] of Object.entries(s.resources)){
  const node=document.createElement("div");
  node.textContent=name+": "+Math.floor(value);resources.append(node);
 }
 choices.training=s.catalog.training.filter(x=>x.available);
 choices.research=s.catalog.research.filter(x=>x.available);
 choices.buildings=s.catalog.buildings.filter(x=>x.ageUnlocked&&x.affordable);
 const cost=x=>Object.entries(x.cost).filter(([,v])=>v>0)
  .map(([k,v])=>k[0]+Math.round(v)).join(" ");
 refreshSelect($("trainChoice"),choices.training,"No recruitment available",
  x=>x.name+" · "+x.facility+" · "+cost(x));
 refreshSelect($("researchChoice"),choices.research,"No research available",
  x=>x.name+" · "+cost(x));
 refreshSelect($("buildChoice"),choices.buildings,"No affordable buildings",
  x=>x.kind+" · "+cost(x));
 $("train").disabled=!choices.training.length;$("research").disabled=!choices.research.length;
 $("build").disabled=!choices.buildings.length;
 $("opponents").textContent=s.players.slice(1)
  .map(p=>p.faction+" ("+p.id+") — "+(p.defeated?"Defeated":"Active")+
   " · "+p.units.length+" visible units").join("\n");
 $("opponents").style.whiteSpace="pre-line";
 const ours=me.units.filter(x=>selected.has(x.id));
 $("selection").textContent=ours.length?
  ours.slice(0,4).map(x=>x.archetype+" "+Math.max(0,Math.ceil(x.hp))+" HP").join(" · ")+
  (ours.length>4?" +"+(ours.length-4)+" more":""):
  selectedStructure?
   (s.world.structures.find(site=>site.id===selectedStructure)?.kind??"No selection")+
   " · "+(s.world.structures.find(site=>site.id===selectedStructure)?.owner==="human"?
    "Friendly structure":"Visible enemy structure"):"No units or buildings selected";
 $("status").textContent=s.winner!==null?
  (s.winner==="human"?"Victory! Your faction has won.":s.winner==="draw"?"Draw! No surviving empires.":"Match finished: "+s.winner):
  s.humanDefeated?"Defeat — your civilization has fallen":
  (paused?"Paused · ":"")+(me.faction+" vs "+(s.players.length-1)+" AI opponents");
}
async function init3D(){
 if(renderer||loading3d)return;
 loading3d=true;
 try{
  renderer=createWebGLRenderer(canvas);
  if(!renderer)throw Error("WebGL unavailable on this device");
  await renderer.loadAssets({notify:render3d});
  await renderer.loadFactionAssets({notify:render3d});
  render3d();log("3D models loaded");
 }catch(e){
  log("3D battlefield unavailable: "+e.message);
  $("status").textContent="3D battlefield unavailable — WebGL is required.";
 }
 finally{loading3d=false;}
}
function render3d(){
 if(!renderer||!state)return;
 try{
  renderer.setCamera(camera.pose((world,x,z)=>sampleTerrain(world,x,z,heightFor)));
  renderer.draw(state.world,{players:state.players,viewerId:"human",
   elapsedMs:state.elapsedMs},selected);
 }catch(e){log("3D render: "+e.message);}
}
function draw(){render3d();}
function setTool(mode){tool=mode;
 for(const name of ["select","move","attack","build"]){
  $(name)?.classList.toggle("active",name===mode);
 } }
function structureAt(x,y){
 if(!state)return null;
 return state.world.structures.find(site=>x>=site.x&&
  x<site.x+(site.width??2)&&y>=site.y&&y<site.y+(site.height??2))??null;
}
function unitAt(x,y){
 if(!state)return null;
 const all=state.players.flatMap(p=>p.units.map(u=>({...u,side:p.id})));
 return all.filter(u=>Math.abs(u.x-x)<=1&&Math.abs(u.y-y)<=1)
  .sort((a,b)=>(a.x-x)**2+(a.y-y)**2-(b.x-x)**2-(b.y-y)**2)[0]??null;
}
function tileClick(x,y,shift=false){
 if(!state||state.winner!==null)return;
 x=Math.floor(x);y=Math.floor(y);
 if(x<0||y<0||x>=state.world.width||y>=state.world.height)return;
 const unit=unitAt(x,y),ours=state.players[0].units;
 if(tool==="build"){
  const building=choices.buildings[Number($("buildChoice").value)];
  const workerUnit=ours.find(u=>selected.has(u.id)&&u.archetype==="Worker");
  if(!building||!workerUnit){log("Select an active Worker and a building");return;}
  order({action:"build",kind:building.kind,x,y,workers:[workerUnit.id]});
  setTool("select");return;
 }
 if(unit?.side==="human"&&(tool==="select"||tool==="attack")){
  selectedStructure=null;
  if(!shift)selected.clear();
  if(shift&&selected.has(unit.id))selected.delete(unit.id);
  else selected.add(unit.id);
  updateSidebar(state);draw();return;
 }
 if(tool==="move"){
  if(!selected.size){log("Select units first");return;}
  for(const id of selected)order({action:"move",unitId:id,x,y});
  setTool("select");return;
 }
 if(tool==="attack"&&unit?.side!=="human"&&unit){
  for(const id of selected)order({action:"attack",attacker:id,
   targetPlayer:unit.side,target:unit.id});
  setTool("select");return;
 }
 if(tool==="select"){
  const site=structureAt(x,y);
  if(site){selectedStructure=site.id;selected.clear();
   updateSidebar(state);draw();return;}
 }
 if(!shift)selected.clear();
 selectedStructure=null;
 updateSidebar(state);draw();
}
canvas.addEventListener("pointerdown",e=>{
 panning={x:e.clientX,y:e.clientY,moved:false};
 canvas.setPointerCapture(e.pointerId);
});
canvas.addEventListener("pointermove",e=>{
 if(!panning||!renderer)return;
 const dx=e.clientX-panning.x,dy=e.clientY-panning.y;
 if(Math.abs(dx)+Math.abs(dy)>2)panning.moved=true;
 renderer.orbit(dx,dy);panning.x=e.clientX;panning.y=e.clientY;
 render3d();
});
canvas.addEventListener("pointerup",e=>{
 if(!panning?.moved&&renderer&&state){
  const rect=canvas.getBoundingClientRect();
  const pick=renderer.pick((e.clientX-rect.left)*canvas.width/rect.width,
   (e.clientY-rect.top)*canvas.height/rect.height);
  if(pick)tileClick(pick.x,pick.y,e.shiftKey);
 }
 panning=null;
});
canvas.addEventListener("wheel",e=>{
 e.preventDefault();renderer?.zoom(Math.sign(e.deltaY));render3d();
},{passive:false});
$("launch").onclick=()=>{
 $("launch").disabled=true;focusInitial=true;selectedStructure=null;
 worker.postMessage({type:"start",settings:{
 faction:$("faction").value,difficulty:$("difficulty").value,
 enemies:Number($("enemies").value),seed:Number($("seed").value)}});
};
$("newGame").onclick=()=>{$("setup").hidden=false;$("launch").disabled=false;};
$("saveGame").onclick=()=>worker.postMessage({type:"save"});
$("loadGame").onclick=async()=>{
 try{const save=await stored("read");
  if(!save){log("No saved skirmish on this browser");return;}
  worker.postMessage({type:"load",encoded:save});}
 catch(e){log("Could not load local save: "+e.message);}
};
$("pause").onclick=()=>worker.postMessage({type:"pause"});
$("speed").onclick=()=>{speed=speed===1?2:speed===2?4:1;
 worker.postMessage({type:"speed",multiplier:speed});$("speed").textContent="Speed "+speed+"×";};
$("step").onclick=()=>worker.postMessage({type:"singleStep"});
for(const mode of ["select","move","attack"])$(mode).onclick=()=>setTool(mode);
$("stop").onclick=()=>{for(const id of selected)order({action:"stop",unitId:id});};
$("workers").onclick=()=>selectWhere(x=>x.archetype==="Worker");
$("military").onclick=()=>selectWhere(x=>x.archetype!=="Worker");
function selectWhere(fn){if(!state)return;selectedStructure=null;selected=new Set(
 state.players[0].units.filter(fn).slice(0,24).map(x=>x.id));
 updateSidebar(state);draw();}
$("train").onclick=()=>{const row=choices.training[Number($("trainChoice").value)];
 if(row)order({action:"train",facility:row.facility,role:row.role});};
$("research").onclick=()=>{const row=choices.research[Number($("researchChoice").value)];
 if(row)order({action:"research",facility:row.facility,id:row.id});};
$("build").onclick=()=>{setTool("build");log("Select a Worker and click grass to place the building");};
window.addEventListener("keydown",e=>{
 if(["INPUT","SELECT"].includes(document.activeElement?.tagName))return;
 if(e.key.toLowerCase()==="w")selectWhere(x=>x.archetype==="Worker");
 if(e.key.toLowerCase()==="a")selectWhere(x=>x.archetype!=="Worker");
 if(e.key==="Escape"){selected.clear();setTool("select");if(state)updateSidebar(state);draw();}
});
worker.onmessage=async({data})=>{
 switch(data.type){
  case "state":state=data.state;
   camera.setMap(state.world);
   if(focusInitial){
    const first=state.players[0].units.find(u=>u.archetype==="Scout")??
     state.players[0].units[0];
    if(first)camera.focus(first.x+.5,first.y+.5,{immediate:true});
    focusInitial=false;
   }
   selected=new Set([...selected].filter(id=>state.players[0].units.some(x=>x.id===id)));
   if(selectedStructure&&!state.world.structures.some(site=>site.id===selectedStructure))
    selectedStructure=null;
   updateSidebar(state);draw();break;
  case "started":$("setup").hidden=true;$("launch").disabled=false;
   selected.clear();selectedStructure=null;paused=false;setTool("select");
   log("Started "+data.faction+" vs "+data.enemies+" AI · "+data.difficulty);break;
  case "paused":paused=data.paused;$("pause").textContent=paused?"Resume":"Pause";
   $("step").disabled=!paused;if(state)updateSidebar(state);break;
  case "loaded":$("setup").hidden=true;paused=true;focusInitial=false;
   $("pause").textContent="Resume";$("step").disabled=false;log("Saved match loaded (paused)");break;
  case "save":
   try{await stored("write",data.encoded);log("Skirmish saved on this device");}
   catch(e){log("Save failed: "+e.message);}
   break;
  case "error":$("launch").disabled=false;log("Error: "+data.message);break;
  case "ordered":log("Order accepted: "+data.action);break;
 }
};
setTool("select");
void init3D();
