import {makeMap,at,placeBuilding,canPlace,asciiMap,mapChecksum} from "../src/map.js";
import {projectTile,unprojectTile,diamond,block} from "./isometric.js";
import {createWebGLRenderer} from "./webgl3d.js";
import {createMatch,command,step,checksum} from "../src/simulation.js";
import {FACTIONS,mandatory} from "../src/constants.js";
import {attachBattlefield} from "../src/battlefield.js";
import {enableBot} from "../src/ai.js";
import {installFullCatalog} from "../src/fullCatalog.js";
const $=id=>document.getElementById(id);
const canvas=$("map"),ctx=canvas.getContext("2d",{alpha:false});
const WIDTH=40,HEIGHT=32,TILE=20;
let selected=null,selectedUnit=null,selectedUnits=new Set(),isometric=false,view3d=false,renderer3d=null,mode="inspect",auto=null,seed=42,world,match;
let fullData=null;
function log(s){
 const d=document.createElement("div");
 d.textContent="["+new Date().toLocaleTimeString()+"] "+s;
 $("log").prepend(d);
 while($("log").children.length>48)$("log").lastElementChild.remove();
}
function reset(){
 if(auto){clearInterval(auto);auto=null;$("auto").textContent="Auto-run: Off";}
 world=makeMap({width:WIDTH,height:HEIGHT,seed,players:2});
 const faction=$("faction").value;
 match=createMatch([{id:"player",faction},{id:"opponent",faction:faction==="Orcs"?"Humans":"Orcs"}],seed);
 if(fullData)installFullCatalog(match,fullData);
 attachBattlefield(match,world);
 enableBot(match,"opponent","Normal");
 selected=null;selectedUnit=match.players[0].units[0].id;selectedUnits=new Set([selectedUnit]);mode="inspect";$("log").replaceChildren();
 log("Simulation reset; " + faction + " starts in Age I.");
 draw();render();
}
function render(){
 const p=match.players[0],r=p.resources;
 $("stats").innerHTML=[
 ["Time",Math.floor(match.elapsedMs/60000)+"m "+Math.floor(match.elapsedMs/1000)%60+"s"],
 ["Civilization",p.faction],["Age",p.age],["Population",p.popUsed+" / "+p.popCap],["Friendly units",p.units.filter(u=>u.alive).length],["AI units",match.players[1].units.filter(u=>u.alive).length],
 ...Object.keys(r).map(k=>[k,r[k]])
 ].map(([k,v])=>'<div class="stat"><span>'+k+'</span><b>'+v+'</b></div>').join("");
 $("status").textContent="Tick "+match.tick+"  •  Seed "+world.seed+"  •  Map checksum "+mapChecksum(world)+"  •  Rules checksum "+checksum(match);
 $("research").disabled=!mandatory.some(t=>t.age===p.age&&!p.completed.includes(t.id));
}
const COLORS={grass:"#4b795e",forest:"#24533e",hill:"#657279",water:"#204767",deposit:"#b69a47"};
function drawTopDown(){
 ctx.clearRect(0,0,canvas.width,canvas.height);
 for(const t of world.tiles){
   ctx.fillStyle=COLORS[t.terrain]??"#253d4e";
   ctx.fillRect(t.x*TILE,t.y*TILE,TILE-1,TILE-1);
   if(t.resource&&t.terrain==="deposit"){ctx.fillStyle="#e6ce7e";ctx.fillRect(t.x*TILE+6,t.y*TILE+6,8,8);}
   if(t.occupied){ctx.fillStyle="#b7b4a5";ctx.fillRect(t.x*TILE+1,t.y*TILE+1,TILE-3,TILE-3);}
 }
 for(const s of world.starts){
   ctx.fillStyle=s.player===0?"#f7f6e5":"#de7777";
   ctx.fillRect(s.x*TILE+3,s.y*TILE+3,TILE-6,TILE-6);
   ctx.fillStyle="#101c27";ctx.font="12px system-ui";ctx.fillText(String(s.player+1),s.x*TILE+7,s.y*TILE+14);
 }
 for(const [index,p] of match.players.entries()){
   const units=p.units.filter(u=>u.alive&&Number.isInteger(u.x));
   for(let j=0;j<units.length;j++){
     const u=units[j],px=u.x*TILE+10+(j%3-1)*3,py=u.y*TILE+10+(Math.floor(j/3)%3-1)*3;
     ctx.beginPath();ctx.arc(px,py,selectedUnit===u.id?6:4,0,Math.PI*2);
     ctx.fillStyle=index===0?"#c5eeff":"#f58a7c";ctx.fill();
     if(selectedUnit===u.id){ctx.lineWidth=2;ctx.strokeStyle="#fce57d";ctx.stroke();}
   }
 }
 if(selected){ctx.strokeStyle="#b5f2ff";ctx.lineWidth=3;ctx.strokeRect(selected.x*TILE+1,selected.y*TILE+1,TILE-2,TILE-2);}
}
function drawIsometric(){
 ctx.clearRect(0,0,canvas.width,canvas.height);
 const tiles=[...world.tiles].sort((a,b)=>(a.x+a.y)-(b.x+b.y)||a.y-b.y||a.x-b.x);
 for(const t of tiles){
  const p=projectTile(t.x,t.y),color=COLORS[t.terrain]??"#253d4e";
  if(t.occupied)block(ctx,t.x,t.y,"#b9afa1",10);
  else if(t.terrain==="hill")block(ctx,t.x,t.y,color,6);
  else{
   diamond(ctx,p.x,p.y,color);
   if(t.resource)diamond(ctx,p.x,p.y,"#d4b85e",2);
  }
 }
 for(const start of world.starts){
  const p=projectTile(start.x,start.y);
  ctx.fillStyle=start.player===0?"#f5f4db":"#da8a7f";
  ctx.font="bold 14px system-ui";ctx.fillText(String(start.player+1),p.x-4,p.y-11);
 }
 for(const [index,p] of match.players.entries())for(const u of p.units.filter(u=>u.alive&&Number.isInteger(u.x))){
  const point=projectTile(u.x,u.y),isSelected=selectedUnits.has(u.id);
  ctx.fillStyle=index===0?"#d1f1fa":"#f29488";
  ctx.beginPath();ctx.arc(point.x,point.y-5,isSelected?5:3.5,0,Math.PI*2);ctx.fill();
  if(isSelected){ctx.strokeStyle="#fce57d";ctx.lineWidth=2;ctx.stroke();}
 }
 if(selected){
  const point=projectTile(selected.x,selected.y);
  ctx.strokeStyle="#c8fbff";ctx.lineWidth=2;
  ctx.beginPath();ctx.moveTo(point.x,point.y-7);
  ctx.lineTo(point.x+10,point.y);ctx.lineTo(point.x,point.y+7);
  ctx.lineTo(point.x-10,point.y);ctx.closePath();ctx.stroke();
 }
}
function draw(){
 canvas.hidden=view3d;$("map3d").hidden=!view3d;
 if(view3d)renderer3d?.draw(world,match,selectedUnits);
 else if(isometric)drawIsometric();else drawTopDown();
}
function tileInfo(x,y){
 const t=at(world,x,y);
 $("selected").textContent=t?("Tile "+x+","+y+" | "+t.terrain+" | "+(t.resource?t.resource+" ("+t.amount+")":"No deposit")+(t.occupied?" | Occupied":"")):"Outside the map";
}
function clickMap(ev){
 const active=view3d?$("map3d"):canvas,rect=active.getBoundingClientRect();
 const px=(ev.clientX-rect.left)*active.width/rect.width,py=(ev.clientY-rect.top)*active.height/rect.height;
 const tile=view3d?renderer3d?.pick(px,py):isometric?unprojectTile(px,py):
  {x:Math.floor(px/TILE),y:Math.floor(py/TILE)};
 if(!tile){log("No terrain tile at that point.");return;}
 const {x,y}=tile;
 selected={x,y};
 try {
   if(mode==="place"){
     const w=match.players[0].units.find(u=>u.alive&&u.archetype==="Worker");
     if(!w)throw Error("No workers left");
     const id=command(match,{player:"player",action:"build",kind:"Training Camp",x,y,workers:[w.id]});
     log("Construction started: "+id+" (40s).");mode="inspect";
   }else if(mode==="formation"){
     if(!selectedUnits.size)throw Error("Select friendly units first");
     const result=command(match,{player:"player",action:"formation",units:[...selectedUnits],x,y});
     log("Formation ordered for "+result.length+" units.");mode="inspect";
   }else if(mode==="move"){
     if(!selectedUnit)throw Error("Select a friendly unit first");
     command(match,{player:"player",action:"move",unitId:selectedUnit,x,y});
     log("Movement order issued to "+x+","+y);mode="inspect";
   }else if(mode==="attack"){
     const target=match.players[1].units.find(u=>u.alive&&u.x===x&&u.y===y);
     if(!target)throw Error("No enemy unit on that tile");
     command(match,{player:"player",action:"attack",attacker:selectedUnit,targetPlayer:"opponent",target:target.id});
     log("Attack order against "+target.archetype);mode="inspect";
   }else {
     const own=match.players[0].units.find(u=>u.alive&&u.x===x&&u.y===y);
     if(own){
       if(ev.shiftKey){if(selectedUnits.has(own.id))selectedUnits.delete(own.id);else selectedUnits.add(own.id);}
       else{selectedUnits=new Set([own.id]);}
       selectedUnit=[...selectedUnits][0]??null;
       log("Selected "+selectedUnits.size+" unit(s); Shift+click adds or removes.");
     }
   }
 }catch(e){log("Command rejected: "+e.message);}

 tileInfo(x,y);draw();render();
}
function tick(ms){
 try{step(match,ms);render();draw();}
 catch(e){log("Tick failed: "+e.message);if(auto){clearInterval(auto);auto=null;$("auto").textContent="Auto-run: Off";}}
}
$("map").addEventListener("click",clickMap);
$("viewMode").addEventListener("click",()=>{
 if(!isometric&&!view3d)isometric=true;
 else if(isometric){
  if(!renderer3d){
   try{renderer3d=createWebGLRenderer($("map3d"));}
   catch(e){log("WebGL initialization failed: "+e.message);}
  }
  if(renderer3d){isometric=false;view3d=true;}
  else{isometric=false;log("WebGL unavailable; staying in top-down view.");}
 }else view3d=false;
 $("viewMode").textContent=view3d?"View: WebGL 3D":isometric?"View: Isometric":"View: Top-down";
 draw();
});
let dragging=null,ignoreNextClick=false;
const map3d=$("map3d");
map3d.addEventListener("pointerdown",e=>{
 dragging={x:e.clientX,y:e.clientY,moved:false};
 map3d.setPointerCapture(e.pointerId);
});
map3d.addEventListener("pointermove",e=>{
 if(!dragging)return;
 const dx=e.clientX-dragging.x,dy=e.clientY-dragging.y;
 if(Math.abs(dx)+Math.abs(dy)>2)dragging.moved=true;
 dragging.x=e.clientX;dragging.y=e.clientY;
 if(dragging.moved){renderer3d?.orbit(dx,dy);draw();}
});
map3d.addEventListener("pointerup",()=>{
 if(dragging?.moved)ignoreNextClick=true;
 dragging=null;
});
map3d.addEventListener("pointercancel",()=>{dragging=null;});
map3d.addEventListener("click",e=>{
 if(ignoreNextClick){ignoreNextClick=false;return;}
 clickMap(e);
});
map3d.addEventListener("wheel",e=>{
 e.preventDefault();renderer3d?.zoom(Math.sign(e.deltaY));draw();
},{passive:false});
$("formation").addEventListener("click",()=>{
 mode="formation";log("Click the destination for the selected group (up to 24 units).");
});
$("advance10").addEventListener("click",()=>tick(10000));
$("advance60").addEventListener("click",()=>tick(60000));
$("auto").addEventListener("click",()=>{
 if(auto){clearInterval(auto);auto=null;$("auto").textContent="Auto-run: Off";}
 else{auto=setInterval(()=>tick(1000),1000);$("auto").textContent="Auto-run: On";}
});
$("reset").addEventListener("click",()=>{seed++;reset();});
$("faction").addEventListener("change",reset);
$("trainWorker").addEventListener("click",()=>{
 try{command(match,{player:"player",action:"train",facility:"Town Center",role:"Worker"});log("Queued a worker (15s training).");render();}
 catch(e){log("Recruitment failed: "+e.message);}
});
$("research").addEventListener("click",()=>{
 const p=match.players[0];
 const def=mandatory.find(t=>t.age===p.age&&!p.completed.includes(t.id)&&!Object.values(p.researchQueues).some(q=>q.some(j=>j.id===t.id)));
 if(!def){log("No available mandatory technology in this age.");return;}
 try{command(match,{player:"player",action:"research",facility:"Town Center",id:def.id});log("Queued "+def.name+" ("+def.ms/1000+"s).");render();}
 catch(e){log("Research failed: "+e.message);}
});
$("place").addEventListener("click",()=>{mode="place";log("Choose clear 3×3 grass to place a Training Camp using a worker.");});
$("move").addEventListener("click",()=>{mode="move";log("Choose a walkable destination for the selected unit.");});
$("attack").addEventListener("click",()=>{mode="attack";log("Click an enemy unit tile to attack.");});
$("trainFighter").addEventListener("click",()=>{
 const key=Object.keys(match.players[0].unitQueues).find(k=>k.startsWith("Training Camp#"));
 if(!key){log("Construct a Training Camp first.");return;}
 try{command(match,{player:"player",action:"train",facility:key,role:"Club Fighter"});log("Club Fighter queued.");render();}
 catch(e){log("Recruitment failed: "+e.message);}
});
reset();
fetch("/data/balance-v0.2.json")
 .then(response=>{if(!response.ok)throw Error("HTTP "+response.status);return response.json();})
 .then(data=>{
   fullData=data;
   if(match.elapsedMs===0)reset();
   else log("Full faction data loaded. Reset the inspector to activate it.");
 })
 .catch(error=>log("Full faction data unavailable; using shared archetypes: "+error.message));
