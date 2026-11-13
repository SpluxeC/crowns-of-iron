import {createWebGLRenderer} from "/webgl3d.js";
import {createVersionDecoder} from "/streamProtocol.js";
import {attackOrders,stopOrders,selectedVisibleEnemy,attackMoveOrders,stanceOrders} from "/combatOrders.js";
import {createPerformanceTelemetry,formatTiming} from "/perfTelemetry.js";
import {chooseAtTile,unitsInTileRectangle,updateSelection,selectByRole,recallGroup,makeFormationPayload} from "/unitSelection.js";
import {chooseBuilder,queueSummary,formatCost,catalogBuildings,
 catalogTraining,catalogResearch,researchRequest,trainingRequest} from "/clientRules.js";
const $=id=>document.getElementById(id);
const canvas=$("map"),ctx=canvas.getContext("2d",{alpha:false}),canvas3d=$("map3d");
const COLORS={grass:"#4b795e",forest:"#24533e",hill:"#657279",
 water:"#204767",deposit:"#b69a47",unknown:"#122938"};
let token=null,abort=null,pollTimer=null,state=null,room=null,catalog=null,playerId=null,nextSequence=1,version=0;
let renderer=null,view3d=false,selected=new Set(),mode="select",pending=false,refreshing=false,refreshAgain=false;
let drag=null,boxDrag=null,ignoreClick=false;
const controlGroups=new Map(),telemetry=createPerformanceTelemetry({limit:120});
function log(message){
 const div=document.createElement("div");
 div.textContent="["+new Date().toLocaleTimeString()+"] "+message;
 $("log").prepend(div);
 while($("log").children.length>50)$("log").lastElementChild.remove();
}
function text(id,value){$(id).textContent=String(value);}
function setButton(id,enabled){$(id).disabled=!enabled;}
function own(){
 return state?.players?.find(p=>p.id===playerId);
}
function mapDims(){
 const world=state?.battlefield;
 if(!world)return null;
 const step=Math.min(canvas.width/world.width,canvas.height/world.height);
 return {step,x:(canvas.width-world.width*step)/2,
  y:(canvas.height-world.height*step)/2};
}
function draw2d(){
 ctx.clearRect(0,0,canvas.width,canvas.height);
 if(!state?.battlefield)return;
 const world=state.battlefield,d=mapDims();
 for(const t of world.tiles){
  ctx.fillStyle=COLORS[t.terrain]??"#253c4a";
  ctx.fillRect(d.x+t.x*d.step,d.y+t.y*d.step,d.step+.25,d.step+.25);
  if(t.occupied){ctx.fillStyle="#c4b7a1";
   ctx.fillRect(d.x+(t.x+.2)*d.step,d.y+(t.y+.2)*d.step,d.step*.6,d.step*.6);}
  if(t.resource){ctx.fillStyle="#e5c879";
   ctx.fillRect(d.x+(t.x+.38)*d.step,d.y+(t.y+.38)*d.step,d.step*.24,d.step*.24);}
 }
 const team=own()?.team;
 for(const p of state.players)for(const u of p.units??[]){
  if(!u.alive||!Number.isInteger(u.x)||!Number.isInteger(u.y)||u.embarkedAt)continue;
  const x=d.x+(u.x+.5)*d.step,y=d.y+(u.y+.5)*d.step;
  ctx.beginPath();ctx.arc(x,y,selected.has(u.id)?6:Math.max(3,d.step*.22),0,Math.PI*2);
  ctx.fillStyle=p.team===team||p.id===playerId?"#c5eeff":"#f58a7c";ctx.fill();
  if(selected.has(u.id)){ctx.strokeStyle="#ffdc78";ctx.lineWidth=2;ctx.stroke();}
 }
 if(boxDrag?.moved){
  const x=Math.min(boxDrag.startPx.x,boxDrag.currentPx.x),
   y=Math.min(boxDrag.startPx.y,boxDrag.currentPx.y);
  ctx.fillStyle="rgba(120,210,230,.16)";
  ctx.fillRect(x,y,Math.abs(boxDrag.startPx.x-boxDrag.currentPx.x),
   Math.abs(boxDrag.startPx.y-boxDrag.currentPx.y));
  ctx.strokeStyle="#a2e5eb";ctx.lineWidth=2;
  ctx.strokeRect(x,y,Math.abs(boxDrag.startPx.x-boxDrag.currentPx.x),
   Math.abs(boxDrag.startPx.y-boxDrag.currentPx.y));
 }
}
function draw(){
 const start=performance.now();
 canvas.hidden=view3d;canvas3d.hidden=!view3d;
 if(view3d&&renderer&&state?.battlefield)
  renderer.draw(state.battlefield,{players:state.players,viewerId:playerId,
   elapsedMs:state.elapsedMs,orders:state.orders},selected);
 else draw2d();
 telemetry.record(view3d?"webgl-submit":"canvas-2d",performance.now()-start);
}
function info(){
 const p=own(),ready=!!room?.players?.find(p=>p.id===playerId)?.ready;
 text("connection",token?"Connected as "+playerId+" · server version "+version+
   " · stream reconnects automatically":"Disconnected — credentials are not saved");
 text("status",state?"Server tick "+state.tick+" · match time "+Math.floor(state.elapsedMs/1000)+
  "s · "+(state.winner===null?"In progress":("Winner: "+state.winner)):"No active match");
 text("lobbyStatus",room?(room.started?"Match running":room.required?
  "Waiting for players to ready":"Immediate-start local match"):"Connect to see lobby");
 $("players").replaceChildren();
 for(const p of room?.players??[]){
  const div=document.createElement("div");
  div.textContent=p.id+" · "+p.faction+" · "+(p.ready?"Ready":"Not ready")+
   (p.id===room.hostPlayerId?" · Host":"");
  $("players").append(div);
 }
 const canReady=!!token&&!pending&&room?.required&&!room.started;
 setButton("ready",canReady);text("ready",ready?"Not ready":"Ready");
 setButton("start",canReady&&playerId===room.hostPlayerId&&
  room.players.every(p=>p.ready));
 setButton("disconnect",!!token);
 setButton("connect",!token&&!pending);
 const playing=!!token&&!pending&&room?.started&&!state?.winner;
 for(const id of ["move","formation","attack","attackMove"])setButton(id,playing&&selected.size>0);
 setButton("stance",playing&&selected.size>0);
 setButton("stop",playing&&selected.size>0);
 setButton("workers",playing);setButton("military",playing);
 const choices=catalogTraining(catalog),buildings=catalogBuildings(catalog),
  availableResearch=catalogResearch(catalog,$("researchFilter").value);
 const trainValue=$("trainChoice").value,buildValue=$("buildChoice").value;
 $("trainChoice").replaceChildren();
 for(const choice of choices){
  const item=document.createElement("option");item.value=choice.facility+"|"+choice.role;
  item.textContent=(choice.name??choice.role)+" · "+choice.facility+
   " · "+formatCost(choice.cost)+(choice.available?"":" (locked/unaffordable)");
  $("trainChoice").append(item);
 }
 if(choices.some(c=>c.facility+"|"+c.role===trainValue))$("trainChoice").value=trainValue;
 $("buildChoice").replaceChildren();
 for(const building of buildings){
  const item=document.createElement("option");item.value=building.kind;
  item.textContent=building.kind+" ("+formatCost(building.cost)+")"+
   (building.affordable?"":" · insufficient resources");
  $("buildChoice").append(item);
 }
 if(buildings.some(b=>b.kind===buildValue))$("buildChoice").value=buildValue;
 const researchValue=$("researchChoice").value;
 $("researchChoice").replaceChildren();
 for(const tech of availableResearch){
  const item=document.createElement("option");item.value=tech.id;
  item.textContent=tech.name+" ("+tech.id+") · "+formatCost(tech.cost)+
   (tech.available?"":" · unavailable");
  $("researchChoice").append(item);
 }
 if(availableResearch.some(r=>r.id===researchValue))$("researchChoice").value=researchValue;
 const chosenTech=availableResearch.find(t=>t.id===$("researchChoice").value);
 const currentTrain=choices.find(t=>t.facility+"|"+t.role===$("trainChoice").value);
 const currentBuild=buildings.find(t=>t.kind===$("buildChoice").value);
 text("catalogStatus",catalog?("Catalog "+catalog.revision+" · "+catalog.buildings.length+
  " buildings · "+catalog.training.length+" recruit options · "+
  catalog.research.length+" technologies"):"No authoritative catalog");
 const jobs=queueSummary(p);
 $("queues").replaceChildren();
 for(const job of jobs.slice(0,20)){
  const item=document.createElement("div");
  item.textContent=job.type+" · "+job.name+" · "+job.facility+" · "+
   Math.floor(job.progressMs/1000)+"s ";
  const cancel=document.createElement("button");
  cancel.type="button";cancel.textContent="Cancel";
  cancel.disabled=!playing;cancel.addEventListener("click",()=>{
   if(job.type==="Research")send("cancelResearch",{facility:job.facility,id:job.name},
    "Cancelled research: "+job.name);
   else send("cancelTrain",{facility:job.facility,index:job.index},
    "Cancelled recruitment: "+job.name);
  });
  item.append(cancel);$("queues").append(item);
 }
 if(!jobs.length)text("queues","No queued jobs");
 setButton("trainWorker",playing&&!!currentTrain?.available);
 setButton("build",playing&&!!currentBuild?.affordable&&!!chooseBuilder(p,[...selected]));
 setButton("research",playing&&!!chosenTech?.available);
 const details=[...selected].map(id=>p?.units?.find(u=>u.id===id))
  .filter(Boolean).map(u=>u.archetype+" ["+u.hp+"/"+u.maxHp+" HP]");
 text("selection",details.length?selected.size+" units: "+details.slice(0,6).join(", ")+
  (details.length>6?" …":""):"No units selected");
 text("perf","Canvas 2D: "+formatTiming(telemetry.summary("canvas-2d"))+
  " · WebGL CPU submit: "+formatTiming(telemetry.summary("webgl-submit"))+
  " · HTTP requests: "+formatTiming(telemetry.summary("http"))+
  (renderer?" · Mesh models: "+renderer.stats().loadedModels+
   " · Faction meshes: "+renderer.stats().factionModels+
   " · Mesh units: "+renderer.stats().modelUnits+
   " · Fallback units: "+renderer.stats().fallbackUnits+
   " · Terrain GPU rebuilds: "+renderer.stats().terrainRebuilds:""));
 text("groups",Array.from({length:4},(_,i)=>
  (i+1)+": "+(controlGroups.get(String(i+1))?.length??0)).join(" · "));
 $("resources").replaceChildren();
 for(const [k,v] of Object.entries(p?.resources??{})){
  const div=document.createElement("div");div.textContent=k+": "+v;
  $("resources").append(div);
 }
}
async function api(path,method="GET",payload){
 if(!token)throw Error("Connect first");
 const start=performance.now();
 const result=await fetch(path,{method,
  headers:{"x-session-token":token,"Content-Type":"application/json"},
  body:method==="GET"?undefined:JSON.stringify(payload??{})});
 const data=await result.json();
 telemetry.record("http",performance.now()-start);
 if(!result.ok)throw Error(data.error||"Request failed ("+result.status+")");
 return data;
}
async function refresh(){
 if(!token)return;
 if(refreshing){refreshAgain=true;return;}
 refreshing=true;
 try{
  do{
   refreshAgain=false;
   const currentToken=token;
   const [snapshot,lobby,options]=await Promise.all([api("/state"),api("/lobby"),api("/catalog")]);
   if(token!==currentToken)return;
   if(snapshot.version<version&&snapshot.playerId===playerId)continue;
   state=snapshot.state;room=lobby;catalog=options;playerId=snapshot.playerId;
   version=snapshot.version;nextSequence=snapshot.nextSequence;
   const ids=new Set(own()?.units?.filter(u=>u.alive).map(u=>u.id)??[]);
   selected=new Set([...selected].filter(id=>ids.has(id)));
   draw();info();
  }while(refreshAgain&&token);
 }finally{refreshing=false;}
}
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function stream(controller,identity){
 // HTTP fetch permits X-Session-Token; EventSource cannot send custom headers.
 while(token===identity&&!controller.signal.aborted){
  try{
   const response=await fetch("/events",{headers:{"x-session-token":identity},
    signal:controller.signal});
   if(!response.ok)throw Error("Event stream HTTP "+response.status);
   // Recover the authoritative state immediately after every transport reconnect.
   await refresh();
   const reader=response.body.getReader(),decoder=new TextDecoder(),
     eventDecoder=createVersionDecoder();
   while(token===identity&&!controller.signal.aborted){
    const {value,done}=await reader.read();if(done)break;
    for(const serverVersion of eventDecoder.push(decoder.decode(value,{stream:true}))){
     if(serverVersion>=version)
      refresh().catch(e=>log("Resync: "+e.message));
    }
   }
  }catch(e){
   if(controller.signal.aborted||token!==identity)break;
   log("Live transport interrupted: "+e.message);
  }
  if(token!==identity||controller.signal.aborted)break;
  await sleep(1200);
 }
}
async function connect(){
 if(token||pending)return;
 const provided=$("token").value.trim();
 if(!provided){log("Paste a development session token first.");return;}
 token=provided;pending=true;info();
 try{
  await refresh();
  $("token").value="";
  pending=false;info();
  abort=new AbortController();
  stream(abort,provided).catch(e=>log("Stream: "+e.message));
  // Polling fallback also detects missed final frames and state changes while SSE is down.
  pollTimer=setInterval(()=>{
   if(token&&!pending)refresh().catch(e=>log("Polling resync: "+e.message));
  },5000);
  log("Connected to authoritative match. No local simulation runs here.");
 }catch(e){
  log("Connection rejected: "+e.message);
  token=null;state=null;room=null;pending=false;info();
 }
}
function disconnect(){
 abort?.abort();abort=null;
 if(pollTimer!==null){clearInterval(pollTimer);pollTimer=null;}
 token=null;state=null;room=null;catalog=null;playerId=null;
 selected.clear();controlGroups.clear();telemetry.reset();mode="select";view3d=false;
 pending=false;refreshing=false;
 draw();info();log("Disconnected. No session token saved.");
}
async function post(path,body,description){
 if(!token||pending)return;
 pending=true;info();
 try{await api(path,"POST",body);await refresh();log(description);}
 catch(e){log("Server rejected: "+e.message);await refresh().catch(()=>{});}
 finally{pending=false;info();}
}
async function send(action,payload,description){
 if(!room?.started||!token||pending)return;
 const seq=nextSequence;
 await post("/command",{sequence:seq,action,payload},description);
}
async function sendBatch(orders,description){
 if(!room?.started||!token||pending||!orders.length)return;
 await post("/command-batch",{expectedVersion:version,orders},description+
  " ("+orders.length+" units)");
}
function clickedTile(ev){
 if(!state?.battlefield||!room?.started)return;
 const target=view3d?canvas3d:canvas,rect=target.getBoundingClientRect(),
  px=(ev.clientX-rect.left)*target.width/rect.width,
  py=(ev.clientY-rect.top)*target.height/rect.height;
 if(view3d)return renderer?.pick(px,py);
 const d=mapDims();
 const x=Math.floor((px-d.x)/d.step),y=Math.floor((py-d.y)/d.step);
 return x>=0&&y>=0&&x<state.battlefield.width&&y<state.battlefield.height?{x,y}:null;
}
function click(ev){
 const tile=clickedTile(ev);
 if(!tile)return;
 if(mode!=="select"){
  const commandMode=mode;mode="select";
  if(commandMode==="attackMove"&&selected.size){
   const orders=attackMoveOrders(own(),selected,tile.x,tile.y,nextSequence);
   if(orders.length)sendBatch(orders,"Attack-move orders sent");
   else log("Select positioned armed units for attack-move.");
   if(selected.size>16)log("Attack-move batch limited to 16 units.");
  }else if(commandMode==="move"&&selected.size===1){
   send("move",{unitId:[...selected][0],...tile},"Move order sent");
  }else if((commandMode==="formation"||commandMode==="move")&&selected.size){
   const payload=makeFormationPayload(selected,tile.x,tile.y);
   if(payload)send("formation",payload,"Group move order sent");
  }else if(commandMode==="build"){
   const builder=chooseBuilder(own(),[...selected]);
   if(builder&&catalogBuildings(catalog).some(b=>b.kind===$("buildChoice").value&&b.affordable))
    send("build",{kind:$("buildChoice").value,...tile,
     workers:[builder.id]},"Building construction started");
   else log("Select a living, positioned Worker first.");
  }else if(commandMode==="attack"&&selected.size){
   const enemy=selectedVisibleEnemy(state,playerId,tile.x,tile.y);
   if(enemy){
    const orders=attackOrders(own(),selected,enemy.targetPlayer,enemy.targetId,nextSequence);
    if(orders.length)sendBatch(orders,"Attack orders sent");
    else log("No living, armed and positioned attackers selected.");
    if(selected.size>16)log("Group combat batch is limited to 16 units; split larger squads.");
   }else log("No visible enemy unit at that tile.");
  }else log("Select one unit for this command.");
 }else{
  const ownUnit=chooseAtTile(own(),tile);
  if(ownUnit)selected=updateSelection(selected,[ownUnit.id],{
   add:ev.shiftKey,toggle:ev.shiftKey});
  else if(!ev.shiftKey)selected.clear();
 }
 draw();info();
}
$("connect").addEventListener("click",connect);
$("disconnect").addEventListener("click",disconnect);
$("ready").addEventListener("click",()=>post("/lobby/ready",
 {ready:!room.players.find(p=>p.id===playerId).ready},"Ready state updated"));
$("start").addEventListener("click",()=>post("/lobby/start",{},"Host launched match"));
$("trainWorker").addEventListener("click",()=>{
 const [facility,role]=$("trainChoice").value.split("|");
 const payload=trainingRequest(catalog,facility,role);
 if(payload)send("train",payload,role+" queued");
 else log("Recruitment option is unavailable.");
});
$("build").addEventListener("click",()=>{
 if(!chooseBuilder(own(),[...selected])){log("Select a Worker to build.");return;}
 mode="build";log("Click a valid site for "+$("buildChoice").value);
});
$("research").addEventListener("click",()=>{
 const payload=researchRequest(catalog,$("researchChoice").value);
 if(payload)send("research",payload,"Research queued: "+payload.id);
 else log("Technology is unavailable.");
});
for(const id of ["trainChoice","buildChoice","researchChoice","researchFilter"])
 $(id).addEventListener("change",()=>info());
$("stance").addEventListener("click",()=>{
 const stance=$("stanceChoice").value;
 const orders=stanceOrders(own(),selected,stance,nextSequence);
 if(orders.length)sendBatch(orders,"Combat stance "+stance+" applied");
 else log("Select living armed units before setting a combat stance.");
 if(selected.size>16)log("Stance batch limited to 16 units.");
});
$("stop").addEventListener("click",()=>{
 const orders=stopOrders(own(),selected,nextSequence);
 if(orders.length)sendBatch(orders,"Stopped current orders");
 if(selected.size>16)log("Stop batch limited to 16 units; select the rest separately.");
});
$("workers").addEventListener("click",()=>{
 selected=new Set(selectByRole(own(),"workers"));mode="select";draw();info();
});
$("military").addEventListener("click",()=>{
 selected=new Set(selectByRole(own(),"military"));mode="select";draw();info();
});
for(const id of ["move","formation","attack","attackMove","select"]){
 $(id).addEventListener("click",()=>{
  mode=id;log(id==="select"?"Selection enabled":"Choose a target tile for "+id);
 });
}
$("view").addEventListener("click",()=>{
 if(!view3d&&!renderer){
  try{
   renderer=createWebGLRenderer(canvas3d);
   renderer?.loadAssets({notify:()=>{if(view3d)draw();}}).then(
    info=>{
     log("Loaded "+info.models+" base OBJ mesh models.");
     return renderer.loadFactionAssets({notify:()=>{if(view3d)draw();}}).then(
      variants=>log("Loaded "+variants.factionModels+" faction OBJ models."),
      e=>log("Faction model loading failed; base models remain: "+e.message));
    },
    e=>log("OBJ loading failed; showing fallback proxies: "+e.message));
  }catch(e){log("WebGL: "+e.message);}
 }
 if(renderer)view3d=!view3d;
 else log("WebGL unavailable; continuing in 2D.");
 text("view",view3d?"View: WebGL 3D":"View: Top-down");draw();
});
function canvasCoords(ev){
 const rect=canvas.getBoundingClientRect();
 return {x:(ev.clientX-rect.left)*canvas.width/rect.width,
  y:(ev.clientY-rect.top)*canvas.height/rect.height};
}
function tileAtPixels(point){
 if(!state?.battlefield)return null;
 const d=mapDims(),x=Math.floor((point.x-d.x)/d.step),
  y=Math.floor((point.y-d.y)/d.step);
 return {x:Math.max(0,Math.min(state.battlefield.width-1,x)),
  y:Math.max(0,Math.min(state.battlefield.height-1,y))};
}
canvas.addEventListener("pointerdown",e=>{
 if(e.button!==0||mode!=="select"||!room?.started)return;
 const point=canvasCoords(e);
 boxDrag={startPx:point,currentPx:point,moved:false,shift:e.shiftKey};
 canvas.setPointerCapture(e.pointerId);
});
canvas.addEventListener("pointermove",e=>{
 if(!boxDrag)return;
 boxDrag.currentPx=canvasCoords(e);
 if(Math.hypot(boxDrag.currentPx.x-boxDrag.startPx.x,
  boxDrag.currentPx.y-boxDrag.startPx.y)>6)boxDrag.moved=true;
 if(boxDrag.moved)draw();
});
canvas.addEventListener("pointerup",e=>{
 if(!boxDrag)return;
 if(boxDrag.moved){
  const ids=unitsInTileRectangle(own(),tileAtPixels(boxDrag.startPx),
   tileAtPixels(canvasCoords(e)));
  selected=updateSelection(selected,ids,{add:boxDrag.shift});
  ignoreClick=true;
 }
 boxDrag=null;draw();info();
});
canvas.addEventListener("pointercancel",()=>{boxDrag=null;draw();});
canvas.addEventListener("click",e=>{
 if(ignoreClick){ignoreClick=false;return;}
 click(e);
});
window.addEventListener("keydown",e=>{
 if(!token||!room?.started||e.altKey||e.metaKey)return;
 if(["INPUT","SELECT","TEXTAREA","BUTTON"].includes(document.activeElement?.tagName))return;
 const key=e.key.toLowerCase();
 if(key==="escape"){selected.clear();mode="select";draw();info();return;}
 if(key==="a"||key==="w"){
  selected=new Set(selectByRole(own(),key==="a"?"military":"workers"));
  mode="select";draw();info();return;
 }
 if(["1","2","3","4"].includes(key)){
  if(e.ctrlKey){
   controlGroups.set(key,[...selected]);
   log("Saved group "+key+" ("+selected.size+" units)");
  }else{
   selected=new Set(recallGroup(own(),controlGroups.get(key)??[]));
   mode="select";
  }
  e.preventDefault();draw();info();
 }
});
canvas3d.addEventListener("pointerdown",e=>{
 drag={x:e.clientX,y:e.clientY,moved:false};canvas3d.setPointerCapture(e.pointerId);
});
canvas3d.addEventListener("pointermove",e=>{
 if(!drag)return;
 const dx=e.clientX-drag.x,dy=e.clientY-drag.y;
 if(Math.abs(dx)+Math.abs(dy)>2)drag.moved=true;
 drag.x=e.clientX;drag.y=e.clientY;
 if(drag.moved){renderer?.orbit(dx,dy);draw();}
});
canvas3d.addEventListener("pointerup",()=>{
 if(drag?.moved)ignoreClick=true;drag=null;
});
canvas3d.addEventListener("pointercancel",()=>{drag=null;});
canvas3d.addEventListener("click",e=>{
 if(ignoreClick){ignoreClick=false;return;}click(e);
});
canvas3d.addEventListener("wheel",e=>{
 e.preventDefault();renderer?.zoom(Math.sign(e.deltaY));draw();
},{passive:false});
window.addEventListener("beforeunload",()=>abort?.abort());
info();
