/** GitHub Pages single-player shell; multiplayer browser client is untouched. */
import {createWebGLRenderer} from "./webgl3d.js";
const $=id=>document.getElementById(id);
const canvas=$("map"),ctx=canvas.getContext("2d");
const worker=new Worker(new URL("./skirmishWorker.js",import.meta.url),{type:"module"});
let state=null,selected=new Set(),tool="select",paused=false,speed=1,
 view3d=false,renderer=null,threeReady=false,loading3d=false,pendingBuild=null,
 drag=null,panning=null,savePending=false;
const COLORS={grass:"#395b43",forest:"#274b39",water:"#1b4c67",
 hill:"#656f61",deposit:"#88754b",unknown:"#0b1825"};
const FACTIONS=["Humans","Orcs","Dwarfs","Tree Elves","Corrupt Elves","Ursa"];
const unitColors=["#90c4f5","#f08b65","#d2ae68","#8dc87c","#bb88bf","#d1dadc"];
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
  (ours.length>4?" +"+(ours.length-4)+" more":""):"No units selected";
 $("status").textContent=s.winner!==null?
  (s.winner==="human"?"Victory! Your faction has won.":s.winner==="draw"?"Draw! No surviving empires.":"Match finished: "+s.winner):
  s.humanDefeated?"Defeat — your civilization has fallen":
  (paused?"Paused · ":"")+(me.faction+" vs "+(s.players.length-1)+" AI opponents");
}
function draw2d(){
 if(!state||view3d)return;
 const w=state.world.width,h=state.world.height,sx=canvas.width/w,sy=canvas.height/h;
 ctx.clearRect(0,0,canvas.width,canvas.height);
 for(const t of state.world.tiles){
  ctx.fillStyle=COLORS[t.terrain]??COLORS.unknown;
  ctx.fillRect(t.x*sx,t.y*sy,Math.ceil(sx)+.1,Math.ceil(sy)+.1);
  if(t.resource&&t.terrain==="deposit"){
   ctx.fillStyle="#e0cc81";ctx.fillRect((t.x+.32)*sx,(t.y+.32)*sy,sx*.34,sy*.34);
  }
 }
 for(const site of state.world.structures){
  const player=state.players.find(p=>p.id===site.owner);
  ctx.fillStyle=player?.id==="human"?"#c8ddbc":"#be8678";
  ctx.fillRect(site.x*sx,site.y*sy,(site.width??2)*sx,(site.height??2)*sy);
  ctx.strokeStyle="#1a2830";ctx.lineWidth=2;
  ctx.strokeRect(site.x*sx,site.y*sy,(site.width??2)*sx,(site.height??2)*sy);
 }
 for(const [index,p] of state.players.entries())for(const u of p.units){
  const x=(u.x+.5)*sx,y=(u.y+.5)*sy,r=Math.max(4,Math.min(sx,sy)*.32);
  ctx.fillStyle=unitColors[FACTIONS.indexOf(p.faction)]??unitColors[index%6];
  ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle=selected.has(u.id)?"#fffaba":"#162533";
  ctx.lineWidth=selected.has(u.id)?3:1.5;ctx.stroke();
 }
 ctx.strokeStyle="#28404b";ctx.lineWidth=.4;
 for(let x=0;x<=w;x++){ctx.beginPath();ctx.moveTo(x*sx,0);ctx.lineTo(x*sx,canvas.height);ctx.stroke();}
 for(let y=0;y<=h;y++){ctx.beginPath();ctx.moveTo(0,y*sy);ctx.lineTo(canvas.width,y*sy);ctx.stroke();}
}
async function init3D(){
 if(renderer||loading3d)return;
 loading3d=true;
 try{
  renderer=createWebGLRenderer($("map3d"));
  if(!renderer)throw Error("WebGL unavailable on this device");
  await renderer.loadAssets({notify:render3d});
  await renderer.loadFactionAssets({notify:render3d});
  threeReady=true;render3d();log("3D models loaded");
 }catch(e){log("3D preview unavailable: "+e.message);}
 finally{loading3d=false;}
}
function render3d(){
 if(!renderer||!state||!view3d)return;
 try{renderer.draw(state.world,{players:state.players,viewerId:"human",
  elapsedMs:state.elapsedMs},selected);}catch(e){log("3D render: "+e.message);}
}
function draw(){draw2d();render3d();}
function setTool(mode){tool=mode;pendingBuild=null;
 for(const name of ["select","move","attack","build"]){
  $(name)?.classList.toggle("active",name===mode);
 } }
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
 if(!shift)selected.clear();
 updateSidebar(state);draw();
}
canvas.addEventListener("click",e=>{
 const box=canvas.getBoundingClientRect();
 tileClick((e.clientX-box.left)*state.world.width/box.width,
  (e.clientY-box.top)*state.world.height/box.height,e.shiftKey);
});
$("map3d").addEventListener("pointerdown",e=>{
 panning={x:e.clientX,y:e.clientY,moved:false};
 $("map3d").setPointerCapture(e.pointerId);
});
$("map3d").addEventListener("pointermove",e=>{
 if(!panning||!renderer)return;
 const dx=e.clientX-panning.x,dy=e.clientY-panning.y;
 if(Math.abs(dx)+Math.abs(dy)>2)panning.moved=true;
 renderer.orbit(dx,dy);panning.x=e.clientX;panning.y=e.clientY;
 render3d();
});
$("map3d").addEventListener("pointerup",e=>{
 if(!panning?.moved&&renderer&&state){
  const rect=$("map3d").getBoundingClientRect();
  const pick=renderer.pick((e.clientX-rect.left)*$("map3d").width/rect.width,
   (e.clientY-rect.top)*$("map3d").height/rect.height);
  if(pick)tileClick(pick.x,pick.y,e.shiftKey);
 }
 panning=null;
});
$("map3d").addEventListener("wheel",e=>{
 e.preventDefault();renderer?.zoom(Math.sign(e.deltaY));render3d();
},{passive:false});
$("launch").onclick=()=>{
 $("launch").disabled=true;
 worker.postMessage({type:"start",settings:{
 faction:$("faction").value,difficulty:$("difficulty").value,
 enemies:Number($("enemies").value),seed:Number($("seed").value)}});
};
$("newGame").onclick=()=>{$("setup").hidden=false;$("launch").disabled=false;};
$("saveGame").onclick=()=>{savePending=true;worker.postMessage({type:"save"});};
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
$("view").onclick=()=>{
 view3d=!view3d;
 canvas.hidden=view3d;$("map3d").hidden=!view3d;
 $("view").textContent=view3d?"Switch to 2D":"Switch to 3D";
 if(view3d)void init3D();
 draw();
};
for(const mode of ["select","move","attack"])$(mode).onclick=()=>setTool(mode);
$("stop").onclick=()=>{for(const id of selected)order({action:"stop",unitId:id});};
$("workers").onclick=()=>selectWhere(x=>x.archetype==="Worker");
$("military").onclick=()=>selectWhere(x=>x.archetype!=="Worker");
function selectWhere(fn){if(!state)return;selected=new Set(
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
   selected=new Set([...selected].filter(id=>state.players[0].units.some(x=>x.id===id)));
   updateSidebar(state);draw();break;
  case "started":$("setup").hidden=true;$("launch").disabled=false;
   selected.clear();paused=false;setTool("select");
   log("Started "+data.faction+" vs "+data.enemies+" AI · "+data.difficulty);break;
  case "paused":paused=data.paused;$("pause").textContent=paused?"Resume":"Pause";
   $("step").disabled=!paused;if(state)updateSidebar(state);break;
  case "loaded":$("setup").hidden=true;paused=true;
   $("pause").textContent="Resume";$("step").disabled=false;log("Saved match loaded (paused)");break;
  case "save":
   try{await stored("write",data.encoded);log("Skirmish saved on this device");}
   catch(e){log("Save failed: "+e.message);}
   savePending=false;break;
  case "error":$("launch").disabled=false;log("Error: "+data.message);break;
  case "ordered":log("Order accepted: "+data.action);break;
 }
};
setTool("select");
