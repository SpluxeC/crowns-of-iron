import {makeMap,at,placeBuilding,canPlace,asciiMap,mapChecksum} from "../src/map.js";
import {createMatch,command,step,checksum} from "../src/simulation.js";
import {FACTIONS,mandatory} from "../src/constants.js";
import {attachBattlefield} from "../src/battlefield.js";
import {enableBot} from "../src/ai.js";
import {installFullCatalog} from "../src/fullCatalog.js";
const $=id=>document.getElementById(id);
const canvas=$("map"),ctx=canvas.getContext("2d",{alpha:false});
const WIDTH=40,HEIGHT=32,TILE=20;
let selected=null,selectedUnit=null,mode="inspect",auto=null,seed=42,world,match;
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
 selected=null;selectedUnit=match.players[0].units[0].id;mode="inspect";$("log").replaceChildren();
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
function draw(){
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
function tileInfo(x,y){
 const t=at(world,x,y);
 $("selected").textContent=t?("Tile "+x+","+y+" | "+t.terrain+" | "+(t.resource?t.resource+" ("+t.amount+")":"No deposit")+(t.occupied?" | Occupied":"")):"Outside the map";
}
function clickMap(ev){
 const rect=canvas.getBoundingClientRect();
 const x=Math.floor((ev.clientX-rect.left)*canvas.width/rect.width/TILE),y=Math.floor((ev.clientY-rect.top)*canvas.height/rect.height/TILE);
 selected={x,y};
 try {
   if(mode==="place"){
     const w=match.players[0].units.find(u=>u.alive&&u.archetype==="Worker");
     if(!w)throw Error("No workers left");
     const id=command(match,{player:"player",action:"build",kind:"Training Camp",x,y,workers:[w.id]});
     log("Construction started: "+id+" (40s).");mode="inspect";
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
     if(own){selectedUnit=own.id;log("Selected "+own.archetype);}
   }
 }catch(e){log("Command rejected: "+e.message);}

 tileInfo(x,y);draw();render();
}
function tick(ms){
 try{step(match,ms);render();draw();}
 catch(e){log("Tick failed: "+e.message);if(auto){clearInterval(auto);auto=null;$("auto").textContent="Auto-run: Off";}}
}
$("map").addEventListener("click",clickMap);
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
