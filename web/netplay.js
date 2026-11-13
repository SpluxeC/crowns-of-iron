import {createWebGLRenderer} from "/webgl3d.js";
const $=id=>document.getElementById(id);
const canvas=$("map"),ctx=canvas.getContext("2d",{alpha:false}),canvas3d=$("map3d");
const COLORS={grass:"#4b795e",forest:"#24533e",hill:"#657279",
 water:"#204767",deposit:"#b69a47",unknown:"#122938"};
let token=null,abort=null,state=null,room=null,playerId=null,nextSequence=1,version=0;
let renderer=null,view3d=false,selected=new Set(),mode="select",pending=false,refreshing=false,refreshAgain=false;
let drag=null,ignoreClick=false;
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
}
function draw(){
 canvas.hidden=view3d;canvas3d.hidden=!view3d;
 if(view3d&&renderer&&state?.battlefield)
  renderer.draw(state.battlefield,{players:state.players},selected);
 else draw2d();
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
 for(const id of ["move","formation","attack"])setButton(id,playing&&selected.size>0);
 setButton("trainWorker",playing);
 const details=[...selected].map(id=>p?.units?.find(u=>u.id===id))
  .filter(Boolean).map(u=>u.archetype+" ["+u.hp+"/"+u.maxHp+" HP]");
 text("selection",details.length?details.join(", "):"No units selected");
 $("resources").replaceChildren();
 for(const [k,v] of Object.entries(p?.resources??{})){
  const div=document.createElement("div");div.textContent=k+": "+v;
  $("resources").append(div);
 }
}
async function api(path,method="GET",payload){
 if(!token)throw Error("Connect first");
 const result=await fetch(path,{method,
  headers:{"x-session-token":token,"Content-Type":"application/json"},
  body:method==="GET"?undefined:JSON.stringify(payload??{})});
 const data=await result.json();
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
   const [snapshot,lobby]=await Promise.all([api("/state"),api("/lobby")]);
   if(token!==currentToken)return;
   state=snapshot.state;room=lobby;playerId=snapshot.playerId;
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
   const reader=response.body.getReader(),decoder=new TextDecoder();
   let buffer="";
   while(token===identity&&!controller.signal.aborted){
    const {value,done}=await reader.read();if(done)break;
    buffer+=decoder.decode(value,{stream:true});
    let end;
    while((end=buffer.indexOf("\n\n"))>=0){
     const frame=buffer.slice(0,end);buffer=buffer.slice(end+2);
     if(frame.includes("event: version")){
      const dataLine=frame.split("\n").find(line=>line.startsWith("data: "));
      if(dataLine){
       try{
        const event=JSON.parse(dataLine.slice(6));
        if(Number.isSafeInteger(event.version)&&event.version>=version)
         refresh().catch(e=>log("Resync: "+e.message));
       }catch{log("Ignored malformed version notification");}
      }
     }
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
  log("Connected to authoritative match. No local simulation runs here.");
 }catch(e){
  log("Connection rejected: "+e.message);
  token=null;state=null;room=null;pending=false;info();
 }
}
function disconnect(){
 abort?.abort();abort=null;token=null;state=null;room=null;playerId=null;
 selected.clear();mode="select";view3d=false;pending=false;refreshing=false;
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
  if(commandMode==="move"&&selected.size===1){
   send("move",{unitId:[...selected][0],...tile},"Move order sent");
  }else if(commandMode==="formation"&&selected.size){
   send("formation",{units:[...selected].slice(0,24),...tile},"Formation order sent");
  }else if(commandMode==="attack"&&selected.size===1){
   const enemy=state.players.filter(p=>p.id!==playerId&&p.team!==own()?.team)
    .flatMap(p=>(p.units??[]).filter(u=>u.alive&&u.x===tile.x&&u.y===tile.y)
      .map(u=>({unit:u,owner:p.id})))[0];
   if(enemy)send("attack",{attacker:[...selected][0],
     targetPlayer:enemy.owner,target:enemy.unit.id},"Attack order sent");
   else log("No visible enemy unit at that tile.");
  }else log("Select one unit for this command.");
 }else{
  const ownUnit=own()?.units?.find(u=>u.alive&&u.x===tile.x&&u.y===tile.y);
  if(ownUnit){
   if(!ev.shiftKey)selected=new Set([ownUnit.id]);
   else if(selected.has(ownUnit.id))selected.delete(ownUnit.id);
   else if(selected.size<24)selected.add(ownUnit.id);
  }
 }
 draw();info();
}
$("connect").addEventListener("click",connect);
$("disconnect").addEventListener("click",disconnect);
$("ready").addEventListener("click",()=>post("/lobby/ready",
 {ready:!room.players.find(p=>p.id===playerId).ready},"Ready state updated"));
$("start").addEventListener("click",()=>post("/lobby/start",{},"Host launched match"));
$("trainWorker").addEventListener("click",()=>send("train",
 {facility:"Town Center",role:"Worker"},"Worker queued"));
for(const id of ["move","formation","attack","select"]){
 $(id).addEventListener("click",()=>{
  mode=id;log(id==="select"?"Selection enabled":"Choose a target tile for "+id);
 });
}
$("view").addEventListener("click",()=>{
 if(!view3d&&!renderer){
  try{renderer=createWebGLRenderer(canvas3d);}catch(e){log("WebGL: "+e.message);}
 }
 if(renderer)view3d=!view3d;
 else log("WebGL unavailable; continuing in 2D.");
 text("view",view3d?"View: WebGL 3D":"View: Top-down");draw();
});
canvas.addEventListener("click",click);
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
