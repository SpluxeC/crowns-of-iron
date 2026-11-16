/** GitHub Pages single-player shell; multiplayer browser client is untouched. */
import {createWebGLRenderer,heightFor} from "./webgl3d.js";
import {createRtsCamera,sampleTerrain,edgeAxis} from "./rtsCamera.js";
import {projectedEntityHit} from "./rtsPicking.js";
import {cameraForMap,projectWorld,heightFor as terrainHeight} from "./webgl3d.js";
import {clampSelection,rectangleUnits,smartOrder,placementValid,MAX_SELECTION} from "./rtsInteraction.js";
import {createRenderQuality,battlefieldRenderSize} from "./mobilePerformance.js";
const $=id=>document.getElementById(id);
const canvas=$("map3d");
const worker=new Worker(new URL("./skirmishWorker.js",import.meta.url),{type:"module"});
let state=null,selected=new Set(),tool="select",paused=false,speed=1,
 renderer=null,loading3d=false,panning=null,focusInitial=true,
 selectedStructure=null,edgePointer=null,rotationHeld=false,altDown=false,
 activeTouches=new Map(),pinchDistance=null,dragOrigin=null,lastPointer=null;
const feedback=$("feedback"),placement=$("placement"),
 buildOutline=$("buildOutline"),buildPolygon=$("buildPolygon");
let feedbackReset=null;
const camera=createRtsCamera();
let previousFrame=0,lastRender=0,orientationPaused=false;
const mobileDevice=window.matchMedia("(pointer: coarse)").matches||
 window.matchMedia("(max-width: 900px)").matches;
const graphics=createRenderQuality({mobile:mobileDevice,
 devicePixelRatio:window.devicePixelRatio||1});
let qualityResizeQueued=false,frameCounter=0;
let reportedWinner=null;
function displayResults(report){
 if(!report||reportedWinner===report.winner)return;
 reportedWinner=report.winner;
 const summary=$("matchEnd"),body=$("resultBody");
 $("resultHeading").textContent=report.winner==="human"?"Victory!":
  report.winner==="draw"?"Draw!":"Defeat";
 $("resultSubhead").textContent=(report.reason==="time limit"?
  "30-minute skirmish complete · Highest score wins":
  "Match ended by elimination")+" · "+Math.floor(report.elapsedMs/60000)+"m "+
  Math.floor(report.elapsedMs/1000)%60+"s";
 body.replaceChildren();
 for(const player of report.players){
  const tr=document.createElement("tr");
  if(player.id===report.winner)tr.className="winner";
  for(const cell of [player.faction+(player.id==="human"?" (You)":""),
   player.score,player.units,player.buildings,player.researched]){
   const td=document.createElement("td");td.textContent=String(cell);tr.append(td);
  }
  body.append(tr);
 }
 summary.hidden=false;
}
$("closeResults").onclick=()=>$("matchEnd").hidden=true;
$("newFromResults").onclick=()=>{
 $("matchEnd").hidden=true;
 $("setup").hidden=false;$("launch").disabled=false;
};

const empirePanel=$("empirePanel"),empireToggle=$("toggleEmpire");
function showEmpire(open){
 empirePanel.hidden=!open;
 empireToggle.setAttribute("aria-expanded",String(open));
 empireToggle.textContent=open?"Close Empire":"Empire";
}
empireToggle.addEventListener("click",()=>showEmpire(empirePanel.hidden));
$("closeEmpire").addEventListener("click",()=>showEmpire(false));
function resizeBattlefield(){
 // Mobile orientation and external displays can change DPR without a reload.
 graphics.updateDevicePixelRatio(window.devicePixelRatio);
 const r=canvas.getBoundingClientRect();
 if(!r.width||!r.height)return;
 const {width:w,height:h}=battlefieldRenderSize(
  r.width,r.height,graphics.scale(),{mobile:mobileDevice});
 if(canvas.width!==w||canvas.height!==h){
  canvas.width=w;canvas.height=h;
  if(renderer&&state)requestAnimationFrame(()=>render3d());
 }
}
new ResizeObserver(resizeBattlefield).observe(canvas);
window.addEventListener("resize",resizeBattlefield);
window.addEventListener("orientationchange",resizeBattlefield);
resizeBattlefield();
const portraitQuery=window.matchMedia("(orientation: portrait) and (max-width: 900px)");
function checkOrientation(){
 const blocked=portraitQuery.matches;
 if(!state)return;
 if(blocked&&!paused&&!orientationPaused){
  orientationPaused=true;
  worker.postMessage({type:"pause"});
 }else if(!blocked&&orientationPaused){
  orientationPaused=false;
  // Allow state messages to apply the pause before resuming.
  worker.postMessage({type:"pause"});
 }
}
portraitQuery.addEventListener?.("change",checkOrientation);
window.addEventListener("orientationchange",checkOrientation);
$("fullscreen").addEventListener("click",async()=>{
 try{
  if(document.fullscreenElement)await document.exitFullscreen();
  else if(document.documentElement.requestFullscreen){
   await document.documentElement.requestFullscreen();
   // Landscape lock requires fullscreen and is unsupported on some iOS browsers.
   try{await screen.orientation?.lock?.("landscape");}catch{}
  }else log("Fullscreen is unavailable in this browser. Rotate your device to play.");
 }catch(error){log("Fullscreen unavailable: "+error.message);}
 resizeBattlefield();checkOrientation();
});
document.addEventListener("fullscreenchange",()=>{
 $("fullscreen").textContent=document.fullscreenElement?"Exit Fullscreen":"Fullscreen";
 resizeBattlefield();
});
const log=message=>{const area=$("messages");
 area.textContent=(new Date().toLocaleTimeString()+"  "+message+"\n"+area.textContent).slice(0,3200);};
const order=action=>worker.postMessage({type:"order",order:action});
function notify(message,error=false){
 feedback.hidden=false;feedback.textContent=message;
 feedback.classList.toggle("error",error);
 clearTimeout(feedbackReset);
 feedbackReset=setTimeout(()=>{feedback.hidden=true;},2600);
 if(error)log(message);
}
function contextSite(){return state?.world.structures.find(s=>s.id===selectedStructure)??null;}
function projected(unit,world,pose,width,height){
 const cam=cameraForMap(world.width,world.height,pose);
 const tile=world.tiles[unit.y*world.width+unit.x];
 return projectWorld({x:unit.x+.5,z:unit.y+.5,
  y:terrainHeight(tile)+.7},width,height,cam);
}
function pose(){return camera.pose((world,x,z)=>sampleTerrain(world,x,z,heightFor));}
function showRect(a,b){
 const r=canvas.getBoundingClientRect(),rect=$("selectionRect");
 rect.hidden=false;rect.style.left=r.left+Math.min(a.x,b.x)+"px";
 rect.style.top=r.top+Math.min(a.y,b.y)+"px";
 rect.style.width=Math.abs(a.x-b.x)+"px";
 rect.style.height=Math.abs(a.y-b.y)+"px";
}
function clearRect(){ $("selectionRect").hidden=true; }
function placementPreview(x,y,clientX,clientY){
 if(tool!=="build"||!state)return;
 const building=choices.buildings[Number($("buildChoice").value)];
 if(!building)return;
 const valid=placementValid(state.world,x,y,building.footprint);
 const cam=cameraForMap(state.world.width,state.world.height,pose());
 const [w,h]=building.footprint;
 const t=state.world.tiles[y*state.world.width+x];
 const elevation=heightFor(t)+.12;
 const corners=[[x,y],[x+w,y],[x+w,y+h],[x,y+h]].map(([xx,zz])=>
  projectWorld({x:xx,y:elevation,z:zz},canvas.width,canvas.height,cam));
 if(corners.every(Boolean)){
  buildOutline.hidden=false;
  buildOutline.setAttribute("viewBox",`0 0 ${canvas.width} ${canvas.height}`);
  buildPolygon.setAttribute("points",corners.map(p=>p.x+","+p.y).join(" "));
  buildPolygon.classList.toggle("invalid",!valid);
 }else buildOutline.hidden=true;
 placement.style.display="block";placement.style.left=clientX+12+"px";
 placement.style.top=clientY-25+"px";
 placement.textContent=building.kind+" "+building.footprint.join("×")+" "+(valid?"✓":"✕");
 placement.classList.toggle("valid",valid);
}

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
 const selectedSite=contextSite(),facility=selectedSite?.owner==="human"?
  selectedSite.facilityKey:null;
 choices.training=s.catalog.training.filter(x=>x.available&&
  (!facility||x.facility===facility));
 choices.research=s.catalog.research.filter(x=>x.available&&
  (!facility||x.facility===facility));
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
 const detail=$("selectedDetail"),site=contextSite();
 if(site){
  detail.textContent=site.kind+" · "+(site.owner==="human"?"Your building":"Enemy building")+
   " · "+Math.round((site.progress??1)*100)+"% built"+
   (site.facilityKey?" · Production: "+site.facilityKey:"");
 }else if(ours.length){
  const stances=[...new Set(ours.map(x=>x.stance))].join("/");
  detail.textContent=ours.length+" unit(s) · "+ours.map(x=>x.archetype).slice(0,3).join(", ")+
   " · "+stances+" · "+ours.filter(x=>x.order).length+" with orders"+
   " · "+ours.reduce((a,u)=>a+Math.round(u.hp),0)+" total HP";
 }else detail.textContent="Select a unit or building to view its status and actions.";
 $("cancelBuild").hidden=!(site?.owner==="human"&&!site.completed);
 $("repairBuilding").hidden=!(site?.owner==="human"&&site.completed&&
  Number.isFinite(site.hp)&&site.hp<site.maxHp);
 $("applyStance").disabled=!ours.some(x=>x.attack>0);
 $("selectedDetail").title=detail.textContent;
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
  resizeBattlefield();render3d();log("3D models loaded");
 }catch(e){
  log("3D battlefield unavailable: "+e.message);
  $("status").textContent="3D battlefield unavailable — WebGL is required.";
 }
 finally{loading3d=false;}
}
function render3d(){
 if(!renderer||!state||document.hidden)return;
 const begin=performance.now();
 try{
  renderer.setCamera(camera.pose((world,x,z)=>sampleTerrain(world,x,z,heightFor)));
  renderer.draw(state.world,{players:state.players,viewerId:"human",
   elapsedMs:state.elapsedMs},selected);
 }catch(e){log("3D render: "+e.message);}
 finally{
  const ended=performance.now();
  const adjusted=graphics.observe(ended-begin,ended);
  if(adjusted&&!qualityResizeQueued){
   qualityResizeQueued=true;
   requestAnimationFrame(()=>{qualityResizeQueued=false;resizeBattlefield();});
  }
  if(++frameCounter%20===0){
   const status=graphics.stats();
   $("graphicsStats").textContent="Render: "+status.targetFps+
    " FPS cap · "+status.scale.toFixed(2)+"× resolution · CPU "+
    status.averageMs.toFixed(1)+" ms/frame";
  }
 }
}
function draw(){render3d();}
function setTool(mode){tool=mode;placement.style.display="none";buildOutline.hidden=true;
 for(const name of ["select","smart","move","attack","attackMove","formation","patrol","harvest","build"]){
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
function issueOrders(commands,label="Order"){
 if(!commands.length){notify(label+" unavailable for this selection",true);return;}
 for(const entry of commands)order(entry);
 notify(label+" issued ("+commands.length+")");
}
function tileClick(x,y,shift=false,hit=null,context=false){
 if(!state||state.winner!==null)return;
 x=Math.floor(x);y=Math.floor(y);
 if(x<0||y<0||x>=state.world.width||y>=state.world.height)return;
 const tile=state.world.tiles[y*state.world.width+x];
 const unit=hit?.kind==="structure"?null:hit?.kind==="unit"?hit.unit:unitAt(x,y),ours=state.players[0].units;
 const site=hit?.kind==="structure"?hit.site:structureAt(x,y);
 if(tool==="build"&&!context){
  const building=choices.buildings[Number($("buildChoice").value)];
  const workers=ours.filter(u=>selected.has(u.id)&&u.archetype==="Worker").map(u=>u.id);
  if(!building||!workers.length){notify("Select a Worker and choose a building",true);return;}
  if(!placementValid(state.world,x,y,building.footprint)){
   notify("Building footprint must be on unoccupied grass",true);return;
  }
  order({action:"build",kind:building.kind,x,y,workers});
  setTool("select");notify("Building ordered: "+building.kind);return;
 }
 if(context||["smart","move","attack","attackMove","formation","patrol","harvest"].includes(tool)){
  if(!selected.size){notify("Select units first",true);return;}
  const ids=[...selected],armed=ours.filter(u=>selected.has(u.id)&&u.attack>0);
  let commands=[];
  if(context||tool==="smart")
   commands=smartOrder({selected:ids,units:ours,
    hit:hit??(unit?{kind:"unit",unit}:site?{kind:"structure",site}:null),
    tile,terrain:tile,modifier:shift});
  else if(tool==="move")commands=ids.map(unitId=>({action:"move",unitId,x,y}));
  else if(tool==="formation")commands=[{action:"formation",units:ids,x,y}];
  else if(tool==="harvest")commands=ours.filter(u=>selected.has(u.id)&&u.archetype==="Worker")
   .map(u=>({action:"assignHarvest",workerId:u.id,x,y}));
  else if(tool==="attackMove")commands=armed.map(u=>({action:"attackMove",unitId:u.id,x,y}));
  else if(tool==="patrol")commands=armed.map(u=>({action:"patrol",unitId:u.id,x,y}));
  else if(tool==="attack"){
   if(unit&&unit.side!=="human")commands=armed.map(u=>({action:"attack",attacker:u.id,
    targetPlayer:unit.side,target:unit.id}));
   else if(site&&site.owner!=="human")commands=armed.map(u=>({action:"attackStructure",
    unitId:u.id,siteId:site.id}));
  }
  issueOrders(commands,context?"Smart command":tool);
  if(!context)setTool("select");
  return;
 }
 if(unit?.side==="human"){
  selectedStructure=null;
  selected=new Set(clampSelection([unit.id],ours.map(u=>u.id),shift,[...selected]));
  updateSidebar(state);draw();return;
 }
 if(site){
  selectedStructure=site.id;selected.clear();
  updateSidebar(state);showEmpire(true);draw();notify("Selected "+site.kind);return;
 }
 if(!shift)selected.clear();
 selectedStructure=null;updateSidebar(state);draw();
}
const pointAt=e=>{
 const rect=canvas.getBoundingClientRect();
 return {x:e.clientX-rect.left,y:e.clientY-rect.top,width:rect.width,height:rect.height};
};
function stopRotation(){rotationHeld=false;camera.resetRotation();}
canvas.addEventListener("contextmenu",e=>e.preventDefault());
function pickAt(e,context=false){
 if(!renderer||!state)return;
 const rect=canvas.getBoundingClientRect();
 const x=(e.clientX-rect.left)*canvas.width/rect.width,
  y=(e.clientY-rect.top)*canvas.height/rect.height;
 const hit=projectedEntityHit(state.world,state.players,pose(),
  x,y,canvas.width,canvas.height);
 const ground=renderer.pick(x,y);
 if(hit||ground){
  const tile=hit?.kind==="unit"?{x:hit.unit.x,y:hit.unit.y}:
   hit?.kind==="structure"?{x:hit.site.x,y:hit.site.y}:ground;
  tileClick(tile.x,tile.y,e.shiftKey,hit,context);
 }
}
function touchSpan(){
 const list=[...activeTouches.values()];
 return list.length>=2?Math.hypot(list[0].x-list[1].x,list[0].y-list[1].y):0;
}
function finishDrag(e){
 if(!dragOrigin||!state){clearRect();dragOrigin=null;return;}
 const a=dragOrigin,b=pointAt(e);
 const width=canvas.width/Math.max(1,b.width),height=canvas.height/Math.max(1,b.height);
 const ids=rectangleUnits(state.players,state.world,pose(),{
  x1:a.x*width,y1:a.y*height,x2:b.x*width,y2:b.y*height
 },canvas.width,canvas.height,projected);
 selected=new Set(clampSelection(ids,state.players[0].units.map(u=>u.id),
  e.shiftKey,[...selected]));
 selectedStructure=null;updateSidebar(state);draw();
 notify("Selected "+selected.size+" units");
 clearRect();dragOrigin=null;
}
canvas.addEventListener("pointerdown",e=>{
 if(e.pointerType==="mouse"&&![0,1,2].includes(e.button))return;
 if(e.pointerType==="touch"){
  activeTouches.set(e.pointerId,{x:e.clientX,y:e.clientY});
  if(activeTouches.size>=2){pinchDistance=touchSpan();panning=null;dragOrigin=null;clearRect();return;}
 }
 const rotation=e.button===1||e.altKey||altDown;
 panning={x:e.clientX,y:e.clientY,
  startX:e.clientX,startY:e.clientY,moved:false,rotating:rotation,
  pointerType:e.pointerType,button:e.button};
 if(rotation)rotationHeld=true;
 if(e.button===0&&e.pointerType==="mouse"&&tool==="select")
  dragOrigin=pointAt(e);
 try{canvas.setPointerCapture(e.pointerId);}catch{}
 e.preventDefault();
});
canvas.addEventListener("pointermove",e=>{
 edgePointer=pointAt(e);
 if(e.pointerType==="touch"&&activeTouches.has(e.pointerId)){
  activeTouches.set(e.pointerId,{x:e.clientX,y:e.clientY});
  if(activeTouches.size>=2){
   const distance=touchSpan();
   if(pinchDistance&&distance>1)camera.zoom(-200*Math.log(distance/pinchDistance));
   pinchDistance=distance;return;
  }
 }
 if(tool==="build"&&state&&renderer){
  const rect=canvas.getBoundingClientRect();
  const p=renderer.pick((e.clientX-rect.left)*canvas.width/rect.width,
   (e.clientY-rect.top)*canvas.height/rect.height);
  if(p)placementPreview(p.x,p.y,e.clientX,e.clientY);
  else {placement.style.display="none";buildOutline.hidden=true;}
 }
 if(!panning)return;
 const dx=e.clientX-panning.x,dy=e.clientY-panning.y;
 if(Math.hypot(e.clientX-panning.startX,e.clientY-panning.startY)>7)panning.moved=true;
 if(panning.rotating)camera.rotate(dx);
 else if(dragOrigin&&panning.moved&&panning.pointerType==="mouse"&&tool==="select")
  showRect(dragOrigin,pointAt(e));
 else if(panning.pointerType==="touch"&&panning.moved){
  const target=camera.target(),scale=camera.state().radius*.0022,yaw=target.yaw;
  camera.focus(target.x-scale*(dx*Math.cos(yaw)-dy*Math.sin(yaw)),
   target.z+scale*(dx*Math.sin(yaw)+dy*Math.cos(yaw)));
 }
 panning.x=e.clientX;panning.y=e.clientY;
});
canvas.addEventListener("pointerup",e=>{
 if(e.pointerType==="touch"){
  activeTouches.delete(e.pointerId);
  if(pinchDistance!==null){
   if(activeTouches.size<2)pinchDistance=null;
   panning=null;dragOrigin=null;clearRect();return;
  }
 }
 if(panning?.rotating)stopRotation();
 else if(dragOrigin&&panning?.moved)finishDrag(e);
 else if(panning&&renderer&&state)pickAt(e,panning.button===2);
 panning=null;dragOrigin=null;clearRect();
});
canvas.addEventListener("pointercancel",e=>{
 activeTouches.delete(e.pointerId);pinchDistance=null;
 stopRotation();panning=null;dragOrigin=null;clearRect();edgePointer=null;
});
canvas.addEventListener("pointerleave",()=>{
 edgePointer=null;
 if(tool==="build"){placement.style.display="none";buildOutline.hidden=true;}
});
canvas.addEventListener("wheel",e=>{
 e.preventDefault();
 camera.zoom(e.deltaY*(e.deltaMode===1?16:e.deltaMode===2?canvas.height:1));
},{passive:false});
window.addEventListener("blur",()=>{stopRotation();edgePointer=null;panning=null;
 activeTouches.clear();pinchDistance=null;dragOrigin=null;clearRect();
 for(const key of ["w","a","s","d","arrowup","arrowdown","arrowleft","arrowright"])
  camera.key(key,false);
});
function cameraFrame(now){
 const dt=previousFrame?Math.min(.1,(now-previousFrame)/1000):1/60;
 previousFrame=now;
 if(state&&renderer){
  const pointer=edgePointer;
  const edge=pointer&&!panning&&!rotationHeld?
   edgeAxis(pointer.x,pointer.y,pointer.width,pointer.height):{x:0,z:0};
  const changed=camera.update(dt,{edge,terrainHeight:
   (world,x,z)=>sampleTerrain(world,x,z,heightFor)});
  if(changed&&now-lastRender>=graphics.frameInterval()){render3d();lastRender=now;}
  const pos=camera.state();
  const status=$("cameraStatus");
  if(status)status.textContent="Camera: X "+pos.x.toFixed(1)+" · Z "+
   pos.z.toFixed(1)+" · Angle "+(pos.pitch*180/Math.PI).toFixed(0)+
   "° · Zoom "+Math.round(pos.radius);
 }
 requestAnimationFrame(cameraFrame);
}
requestAnimationFrame(cameraFrame);
$("graphicsMode").addEventListener("change",e=>{
 graphics.setMode(e.target.value);resizeBattlefield();
 const status=graphics.stats();
 $("graphicsStats").textContent=status.mode+" · "+status.scale.toFixed(2)+
  "× resolution · "+status.targetFps+" FPS target";
});
$("launch").onclick=()=>{
 $("launch").disabled=true;focusInitial=true;selectedStructure=null;
 worker.postMessage({type:"start",settings:{
 faction:$("faction").value,difficulty:$("difficulty").value,
 enemies:Number($("enemies").value),seed:Number($("seed").value)}});
};
$("newGame").onclick=()=>{$("matchEnd").hidden=true;$("setup").hidden=false;$("launch").disabled=false;};
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
for(const mode of ["select","smart","move","attack","attackMove","formation","patrol","harvest"])
 $(mode).onclick=()=>{
  if(mode!=="select"&&!selected.size){notify("Select units before issuing orders",true);return;}
  setTool(mode);
  if(mode!=="select")notify("Tap a destination for "+mode);
 };
$("stop").onclick=()=>{
 if(!selected.size){notify("Select units to stop",true);return;}
 for(const id of selected)order({action:"stop",unitId:id});
 notify("Stop issued to "+selected.size+" unit(s)");
};
$("workers").onclick=()=>selectWhere(x=>x.archetype==="Worker");
$("military").onclick=()=>selectWhere(x=>x.archetype!=="Worker");
function selectWhere(fn){if(!state)return;selectedStructure=null;selected=new Set(
 state.players[0].units.filter(fn).slice(0,24).map(x=>x.id));
 updateSidebar(state);draw();}
$("train").onclick=()=>{
 const row=choices.training[Number($("trainChoice").value)];
 if(row){order({action:"train",facility:row.facility,role:row.role});
  notify("Recruiting "+row.name);}
};
$("research").onclick=()=>{
 const row=choices.research[Number($("researchChoice").value)];
 if(row){order({action:"research",facility:row.facility,id:row.id});
  notify("Research started: "+row.name);}
};
$("build").onclick=()=>{
 if(!state?.players[0].units.some(u=>u.archetype==="Worker"&&selected.has(u.id))){
  notify("Select a Worker before placing a building",true);return;
 }
 setTool("build");showEmpire(false);notify("Tap clear grass to place building");
};
$("applyStance").onclick=()=>{
 if(!state)return;
 const armed=state.players[0].units.filter(u=>selected.has(u.id)&&u.attack>0);
 issueOrders(armed.map(u=>({action:"stance",unitId:u.id,
  stance:$("stanceChoice").value})),"Stance");
};
$("cancelBuild").onclick=()=>{
 const site=contextSite();if(!site||site.owner!=="human"||site.completed)return;
 order({action:"cancelBuild",siteId:site.id});notify("Construction cancelled");
};
$("repairBuilding").onclick=()=>{
 const site=contextSite();
 if(!site||site.owner!=="human")return;
 const workerIds=state.players[0].units.filter(u=>u.archetype==="Worker"&&
  Math.max(site.x-u.x,0,u.x-(site.x+(site.width??2)-1))+
  Math.max(site.y-u.y,0,u.y-(site.y+(site.height??2)-1))<=1)
  .slice(0,4).map(u=>u.id);
 if(!workerIds.length){
  notify("Move a Worker adjacent to the building to repair it",true);return;
 }
 order({action:"repairBuilding",siteId:site.id,workers:workerIds,amount:20});
 notify("Repair requested");
};
window.addEventListener("keydown",e=>{
 if(e.key==="Alt"){altDown=true;return;}
 const typing=["INPUT","SELECT","TEXTAREA"].includes(document.activeElement?.tagName)||
  document.activeElement?.isContentEditable;
 if(typing)return;
 if(e.key==="Backspace"){e.preventDefault();stopRotation();return;}
 if(camera.key(e.key,true)){e.preventDefault();return;}
 if(e.key.toLowerCase()==="q"){setTool("smart");return;}
 if(e.key.toLowerCase()==="f"){setTool("formation");return;}
 if(e.key.toLowerCase()==="g"){setTool("harvest");return;}
 if(e.key==="Escape"){
  clearRect();selected.clear();selectedStructure=null;setTool("select");
  if(state)updateSidebar(state);draw();
 }
});
window.addEventListener("keyup",e=>{
 if(e.key==="Alt"){altDown=false;if(rotationHeld)stopRotation();}
 camera.key(e.key,false);
});
worker.onmessage=async({data})=>{
 switch(data.type){
  case "state":state=data.state;
   checkOrientation();
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
   updateSidebar(state);draw();
   if(state.result)displayResults(state.result);
   break;
  case "started":$("setup").hidden=true;$("launch").disabled=false;
   reportedWinner=null;$("matchEnd").hidden=true;
   showEmpire(false);checkOrientation();
   selected.clear();selectedStructure=null;paused=false;setTool("select");
   log("Started "+data.faction+" vs "+data.enemies+" AI · "+data.difficulty);break;
  case "paused":paused=data.paused;$("pause").textContent=paused?"Resume":"Pause";
   $("step").disabled=!paused;if(state)updateSidebar(state);break;
  case "loaded":$("setup").hidden=true;paused=true;focusInitial=false;
   reportedWinner=null;
   showEmpire(false);
   $("pause").textContent="Resume";$("step").disabled=false;log("Saved match loaded (paused)");break;
  case "save":
   try{await stored("write",data.encoded);log("Skirmish saved on this device");}
   catch(e){log("Save failed: "+e.message);}
   break;
  case "error":$("launch").disabled=false;notify("Action failed: "+data.message,true);break;
  case "ordered":log("Order accepted: "+data.action);break;
 }
};
setTool("select");
void init3D();
