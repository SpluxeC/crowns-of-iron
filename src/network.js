import {randomBytes} from "node:crypto";
import {createMatch,command,step,snapshot,checksum} from "./simulation.js";
import {makeMap} from "./map.js";
import {attachBattlefield} from "./battlefield.js";
import {assert,clone} from "./util.js";
import {researchMultiplier} from "./technologyEffects.js";

// Local authoritative protocol prototype; no public deployment, matchmaking,
// dedicated authorization backend or production fog-of-war guarantees.
const COMMANDS=new Set(["allocate","research","cancelResearch","train","cancelTrain",
  "move","attack","attackStructure","repairBuilding","build","cancelBuild","upgrade","cancelUpgrade","gate","garrison","ungarrison","formation","siege","seaTrade","cancelSeaTrade","embark","disembark","deployRamp","assaultBattlement","convert","surveyAether","aetherPulse","disrupt","ability"]);
export class MatchHost{
  constructor(participants,seed=1){
    this.match=createMatch(participants,seed);
    attachBattlefield(this.match,makeMap({players:participants.length,seed}));
    this.sessions=new Map();
    this.events=[];
    this.sequence=0;
    this.version=0;
    for(const p of this.match.players){
      const token=randomBytes(24).toString("hex");
      this.sessions.set(token,{playerId:p.id,lastSequence:0});
    }
  }
  credentialsFor(playerId){
    const found=[...this.sessions.entries()].find(([token,s])=>s.playerId===playerId);
    assert(found,"Unknown player");
    return {playerId,token:found[0]}; // distribute privately/out of band
  }
  submit({token,sequence,action,payload={}}){
    const session=this.sessions.get(token);
    assert(session,"Unauthorized session");
    assert(Number.isSafeInteger(sequence)&&sequence>session.lastSequence,
      "Out-of-order or duplicate command");
    assert(COMMANDS.has(action),"Command forbidden by network protocol");
    assert(payload&&typeof payload==="object"&&!Array.isArray(payload),"Invalid command payload");
    assert(!("player" in payload)||payload.player===session.playerId,"Spoofed player");
    // Healing/repair are withheld from this remote protocol until server-verified\n    // healer range, casting interval and engineer work loops are implemented.\n    // Assign owner based solely on the authenticated session.
    const order={...clone(payload),player:session.playerId,action};
    // Do not advance sequence on rejected commands. Client may retry properly.
    if(action==="attack"){
      const viewer=this.match.players.find(p=>p.id===session.playerId);
      const enemy=this.match.players.find(p=>p.id===payload.targetPlayer);
      const target=enemy?.units.find(u=>u.id===payload.target&&u.alive);
      assert(target&&(enemy.team===viewer.team||this.isVisible(viewer,target)),
        "Enemy target is not visible");
    }
    if(action==="attackStructure"||action==="siege"||action==="deployRamp"||action==="disrupt"){
      const site=this.match.constructions?.[payload.siteId];
      const location=this.match.battlefield?.structures?.find(s=>s.id===payload.siteId);
      const viewer=this.match.players.find(p=>p.id===session.playerId);
      assert(site&&site.completed&&location&&
        (site.owner===viewer.id||this.isVisible(viewer,location)),
        "Target building is not visible");
    }
    if(action==="convert"){
      const viewer=this.match.players.find(p=>p.id===session.playerId);
      const defender=this.match.players.find(p=>p.id===payload.targetPlayer);
      const target=defender?.units.find(u=>u.id===payload.targetId&&u.alive);
      assert(target&&this.isVisible(viewer,target),"Conversion target is not visible");
    }
    const result=command(this.match,order);
    session.lastSequence=sequence;
    this.sequence++;
    this.version++;
    this.events.push({sequence:this.sequence,version:this.version,player:session.playerId,action,atMs:this.match.elapsedMs});
    return {accepted:true,sequence,matchChecksum:checksum(this.match),result:result??null};
  }
  advance(ms){
    assert(Number.isSafeInteger(ms)&&ms>0&&ms<=60000,"Invalid host tick");
    step(this.match,ms);
    this.version++;
    return {nowMs:this.match.elapsedMs,version:this.version,checksum:checksum(this.match)};
  }
  isVisible(viewer,target){
    if(!Number.isInteger(target.x)||!Number.isInteger(target.y))return false;
    const friendly=this.match.players.filter(p=>p.team===viewer.team);
    return friendly.some(p=>p.units.some(u=>u.alive&&Number.isInteger(u.x)&&
      Math.abs(u.x-target.x)+Math.abs(u.y-target.y)<=
        (u.archetype==="Scout Aircraft"?Math.ceil(7*researchMultiplier(p,"scoutSight")):
          u.archetype==="Scout"?7:4)));
  }
  view(token){
    const session=this.sessions.get(token);
    assert(session,"Unauthorized session");
    const viewer=this.match.players.find(p=>p.id===session.playerId);
    const state=snapshot(this.match),team=viewer.team;
    const friendly=this.match.players.filter(p=>p.team===team);
    const inVision=(x,y)=>Number.isInteger(x)&&Number.isInteger(y)&&
      friendly.some(p=>p.units.some(u=>u.alive&&Number.isInteger(u.x)&&
        Math.abs(u.x-x)+Math.abs(u.y-y)<=
          (u.archetype==="Scout Aircraft"?Math.ceil(7*researchMultiplier(p,"scoutSight")):
            u.archetype==="Scout"?7:4)));
    state.players=state.players.map(p=>{
      if(p.id===viewer.id)return p;
      return {id:p.id,faction:p.faction,team:p.team,age:p.age,defeated:p.defeated,
        units:p.units.filter(u=>u.alive&&inVision(u.x,u.y)).map(u=>({
          id:u.id,owner:u.owner,name:u.name,archetype:u.archetype,
          x:u.x,y:u.y,hp:u.hp,maxHp:u.maxHp,category:u.category
        }))};
    });
    if(state.battlefield){
      if(state.battlefield.fishShoals)state.battlefield.fishShoals=state.battlefield.fishShoals.filter(t=>inVision(t.x,t.y));
      if(state.battlefield.coastalPads)state.battlefield.coastalPads=state.battlefield.coastalPads.filter(t=>{
        const player=this.match.players[t.player];return player?.team===team||inVision(t.x,t.y);
      });
      state.battlefield.tiles=state.battlefield.tiles.map(t=>inVision(t.x,t.y)?t:
        {x:t.x,y:t.y,terrain:"unknown",resource:null,amount:0,occupied:null});
      state.battlefield.structures=state.battlefield.structures.filter(s=>
        s.owner===viewer.id||inVision(s.x,s.y));
      state.battlefield.starts=state.battlefield.starts.filter(s=>{
        const indexed=this.match.players[s.player];
        return indexed?.team===team||inVision(s.x,s.y);
      });
    }
    if(state.constructions)state.constructions=Object.fromEntries(
      Object.entries(state.constructions).filter(([id,c])=>
        c.owner===viewer.id||state.battlefield?.structures?.some(s=>s.id===id)));
    if(state.ruins)state.ruins=Object.fromEntries(
      Object.entries(state.ruins).filter(([id,r])=>r.owner===viewer.id||inVision(r.x,r.y)));
    if(state.orders)state.orders=Object.fromEntries(
      Object.entries(state.orders).filter(([id])=>viewer.units.some(u=>u.id===id)));
    delete state.commands;
    delete state.bots;
    delete state.fullCatalog;
    return {playerId:viewer.id,version:this.version,state,checksum:checksum(state)};
  }
  resync({token,afterVersion=0}){
    const session=this.sessions.get(token);
    assert(session,"Unauthorized session");
    assert(Number.isSafeInteger(afterVersion)&&afterVersion>=0&&
      afterVersion<=this.version,"Invalid client state version");
    // Event metadata excludes private payloads. Only the server's fog-filtered
    // full snapshot is authoritative; a client must never merge guessed units.
    const state=this.view(token);
    const events=this.events.filter(e=>e.version>afterVersion&&e.player===session.playerId)
      .map(e=>({...e}));
    return {...state,events};
  }
  rotateToken(token){
    const session=this.sessions.get(token);
    assert(session,"Unauthorized session");
    this.sessions.delete(token);
    const replacement=randomBytes(24).toString("hex");
    this.sessions.set(replacement,session);
    return {playerId:session.playerId,token:replacement,version:this.version};
  }
  activity(){return this.events.map(e=>({...e}));}
}
