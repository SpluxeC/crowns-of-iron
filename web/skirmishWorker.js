/** Browser-owned single-player simulation. No Node server, tokens or external opponents. */
import {createMatch,command,step} from "../src/simulation.js";
import {makeMap} from "../src/map.js";
import {attachBattlefield} from "../src/battlefield.js";
import {enableBot} from "../src/ai.js";
import {enableUnitCollision} from "../src/unitCollision.js";
import {installFullCatalog} from "../src/fullCatalog.js";
import {playerCommandCatalog} from "../src/commandCatalog.js";
import {exportSave,importSave} from "../src/persistence.js";
const FACTIONS=["Humans","Orcs","Dwarfs","Tree Elves","Corrupt Elves","Ursa"];
let match=null,interval=null,paused=false,speed=1,seq=0;
function send(type,payload={}){postMessage({type,...payload});}
function view(){
 if(!match)return;
 const player=match.players[0],map=match.battlefield;
 const me=player.units.filter(x=>x.alive&&!x.embarkedAt&&!x.garrisonedAt);
 const visible=new Set();
 const reveal=(x,y,r)=>{for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++){
  if(dx*dx+dy*dy<=r*r&&x+dx>=0&&y+dy>=0&&x+dx<map.width&&y+dy<map.height)
   visible.add((y+dy)*map.width+x+dx);
 }};
 for(const u of me)if(Number.isInteger(u.x)&&Number.isInteger(u.y))reveal(u.x,u.y,7);
 for(const s of map.structures)if(s.owner===player.id)reveal(s.x,s.y,9);
 const tiles=map.tiles.map((t,i)=>visible.has(i)?
  {x:t.x,y:t.y,terrain:t.terrain,resource:t.resource,occupied:t.occupied}:
  {x:t.x,y:t.y,terrain:"unknown",resource:null,occupied:null});
 const players=match.players.map((p,i)=>({id:p.id,faction:p.faction,
  age:i===0?p.age:null,alive:p.alive,defeated:p.defeated,
  team:p.team,units:p.units.filter(u=>u.alive&&Number.isInteger(u.x)&&
   (i===0||visible.has(u.y*map.width+u.x))).map(u=>({
   id:u.id,owner:u.owner,archetype:u.archetype,x:u.x,y:u.y,
   hp:u.hp,maxHp:u.maxHp,alive:u.alive}))}));
 const structures=map.structures.filter(s=>
  s.owner===player.id||visible.has(s.y*map.width+s.x));
 return {seq:++seq,elapsedMs:match.elapsedMs,tick:match.tick,winner:match.winner,
  humanDefeated:player.defeated,faction:player.faction,age:player.age,
  resources:player.resources,popUsed:player.popUsed,popCap:player.popCap,
  players,world:{width:map.width,height:map.height,tiles,structures},
  catalog:playerCommandCatalog(match,player.id)};
}
function publish(){if(match)send("state",{state:view()});}
function stop(){if(interval)clearInterval(interval);interval=null;}
function startClock(){stop();interval=setInterval(()=>{
 if(!match||paused||match.winner!==null)return;
 try{step(match,1000*speed);publish();}
 catch(error){paused=true;send("error",{message:error.message});}
},1000);}
function validateStart(config){
 const faction=config?.faction??"Humans",difficulty=config?.difficulty??"Normal",
  enemies=Number(config?.enemies??1),seed=Number(config?.seed??712);
 if(!FACTIONS.includes(faction)||!["Easy","Normal","Hard"].includes(difficulty)||
  !Number.isInteger(enemies)||enemies<1||enemies>7||
  !Number.isSafeInteger(seed)||seed<1||seed>999999999)
  throw Error("Invalid skirmish settings");
 return {faction,difficulty,enemies,seed};
}
async function begin(config){
 const {faction,difficulty,enemies,seed}=validateStart(config);
 const participants=[{id:"human",faction}];
 for(let i=0;i<enemies;i++)participants.push({
  id:"ai-"+(i+1),faction:FACTIONS[(FACTIONS.indexOf(faction)+i+1)%6]});
 const game=createMatch(participants,seed);
 attachBattlefield(game,makeMap({width:48,height:48,players:participants.length,seed}));
 // Load the actual reconciled faction research/units from the static site.
 const response=await fetch(new URL("../data/balance-v0.2.json",import.meta.url));
 if(!response.ok)throw Error("Faction balance data unavailable");
 installFullCatalog(game,await response.json());
 enableUnitCollision(game);
 for(const p of participants.slice(1))enableBot(game,p.id,difficulty);
 match=game;paused=false;speed=1;startClock();publish();
 send("started",{faction,difficulty,enemies,seed});
}
onmessage=async({data})=>{
 try{
  if(data?.type==="start"){await begin(data.settings);return;}
  if(data?.type==="load"){
   const restored=importSave(data.encoded);
   if(restored.players[0]?.id!=="human"||!restored.battlefield||
    restored.players.slice(1).some(p=>!restored.bots?.[p.id]))
    throw Error("Not a saved local AI skirmish");
   match=restored;paused=true;speed=1;startClock();publish();
   send("loaded");return;
  }
  if(!match)throw Error("Start a skirmish first");
  switch(data?.type){
   case "pause":paused=!paused;send("paused",{paused});break;
   case "speed":
    if(![1,2,4].includes(data.multiplier))throw Error("Invalid game speed");
    speed=data.multiplier;send("speed",{speed});break;
   case "order":{
    const payload=data.order;
    if(payload?.player&&payload.player!=="human")throw Error("Cannot control AI");
    const result=command(match,{...payload,player:"human"});
    send("ordered",{action:payload.action,result});publish();break;
   }
   case "save":send("save",{encoded:exportSave(match)});break;
   case "snapshot":publish();break;
   case "singleStep":
    if(!paused)throw Error("Pause before stepping");
    step(match,1000);publish();break;
   default:throw Error("Unknown skirmish request");
  }
 }catch(error){send("error",{message:String(error?.message??error)});}
};
