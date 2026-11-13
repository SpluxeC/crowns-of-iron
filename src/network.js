import {randomBytes} from "node:crypto";
import {createMatch,command,step,snapshot,checksum} from "./simulation.js";
import {makeMap} from "./map.js";
import {attachBattlefield} from "./battlefield.js";
import {assert,clone,hash} from "./util.js";
import {exportSave,importSave} from "./persistence.js";
import {researchMultiplier} from "./technologyEffects.js";
import {playerCommandCatalog} from "./commandCatalog.js";

// Local authoritative protocol prototype; no public deployment, matchmaking,
// dedicated authorization backend or production fog-of-war guarantees.
const COMMANDS=new Set(["allocate","research","cancelResearch","train","cancelTrain",
  "move","attack","attackStructure","repairBuilding","build","cancelBuild","upgrade","cancelUpgrade","gate","garrison","ungarrison","formation","siege","seaTrade","cancelSeaTrade","embark","disembark","deployRamp","assaultBattlement","convert","surveyAether","aetherPulse","disrupt","hospitalHeal","vehicleRepair","ability"]);
export class MatchHost{
  constructor(participants,seed=1,{requireReady=false}={}){
    assert(typeof requireReady==="boolean","Invalid lobby configuration");
    this.match=createMatch(participants,seed);
    this.lobby={required:requireReady,started:!requireReady,
      ready:Object.fromEntries(this.match.players.map(p=>[p.id,false]))};
    attachBattlefield(this.match,makeMap({players:participants.length,seed}));
    this.sessions=new Map();
    this.events=[];
    this.sequence=0;
    this.version=0;
    this.maxCommandsPerVersion=64;
    for(const p of this.match.players){
      const token=randomBytes(24).toString("hex");
      this.sessions.set(token,{playerId:p.id,lastSequence:0});
    }
  }
  catalog(token){
    const session=this.sessions.get(token);
    assert(session,"Unauthorized session");
    return playerCommandCatalog(this.match,session.playerId);
  }
  credentialsFor(playerId){
    const found=[...this.sessions.entries()].find(([token,s])=>s.playerId===playerId);
    assert(found,"Unknown player");
    return {playerId,token:found[0]}; // distribute privately/out of band
  }
  submit({token,sequence,action,payload={}}){
    assert(this.lobby.started,"Match has not started");
    const session=this.sessions.get(token);
    assert(session,"Unauthorized session");
    assert(Number.isSafeInteger(sequence)&&sequence>session.lastSequence,
      "Out-of-order or duplicate command");
    assert(COMMANDS.has(action),"Command forbidden by network protocol");
    assert(session.budgetTick!==this.match.tick||
      (session.commandsThisTick??0)<this.maxCommandsPerVersion,
      "Per-player command budget exhausted");
    assert(JSON.stringify(payload).length<=8192,"Command payload too large");
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
    if(action==="assaultBattlement"){
      const tower=this.match.players.find(p=>p.id===session.playerId)?.units.find(u=>u.id===payload.towerId);
      const site=this.match.constructions?.[tower?.rampSiteId];
      const loc=this.match.battlefield?.structures?.find(s=>s.id===tower?.rampSiteId);
      const viewer=this.match.players.find(p=>p.id===session.playerId);
      assert(site?.completed&&loc&&this.isVisible(viewer,loc),
        "Battlement attack target not visible");
    }
    const result=command(this.match,order);
    session.lastSequence=sequence;
    session.commandsThisTick=(session.budgetTick===this.match.tick?
      (session.commandsThisTick??0):0)+1;
    session.budgetTick=this.match.tick;
    this.sequence++;
    this.version++;
    this.events.push({sequence:this.sequence,version:this.version,player:session.playerId,action,atMs:this.match.elapsedMs});
    return {accepted:true,sequence,version:this.version,matchChecksum:this.view(token).checksum,result:result??null};
  }
  submitBatch({token,expectedVersion,orders}){
    assert(this.lobby.started,"Match has not started");
    const session=this.sessions.get(token);
    assert(session,"Unauthorized session");
    assert(Number.isSafeInteger(expectedVersion)&&expectedVersion===this.version,
      "Client state version is stale");
    assert(Array.isArray(orders)&&orders.length>=1&&orders.length<=16,
      "Batch must contain 1–16 commands");
    const backup=snapshot(this.match),oldSequence=this.sequence,oldVersion=this.version,
      oldEvents=this.events.length,oldLast=session.lastSequence,
      oldBudget=session.commandsThisTick,oldBudgetVersion=session.budgetTick;
    const replies=[];
    try{
      for(const order of orders){
        assert(order&&typeof order==="object"&&!Array.isArray(order),
          "Invalid batched command");
        replies.push(this.submit({token,sequence:order.sequence,
          action:order.action,payload:order.payload??{}}));
      }
    }catch(e){
      this.match=backup;this.sequence=oldSequence;this.version=oldVersion;
      this.events.length=oldEvents;session.lastSequence=oldLast;
      session.commandsThisTick=oldBudget;session.budgetTick=oldBudgetVersion;
      throw e;
    }
    return {accepted:true,version:this.version,commands:replies.length,
      checksum:this.view(token).checksum};
  }
  advance(ms){
    assert(this.lobby.started,"Match has not started");
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
      state.battlefield.tiles=state.battlefield.tiles.map(t=>{
        if(inVision(t.x,t.y))return t;
        const surveyed=viewer.aetherSurveys?.some(p=>p.x===t.x&&p.y===t.y)&&
          t.resource==="Aether";
        return surveyed?{x:t.x,y:t.y,terrain:"unknown",resource:"Aether",amount:null,occupied:null}:
          {x:t.x,y:t.y,terrain:"unknown",resource:null,amount:0,occupied:null};
      });
      state.battlefield.structures=state.battlefield.structures.filter(s=>
        s.owner===viewer.id||inVision(s.x,s.y));
      state.battlefield.starts=state.battlefield.starts.filter(s=>{
        const indexed=this.match.players[s.player];
        return indexed?.team===team||inVision(s.x,s.y);
      });
    }
    if(state.constructions)state.constructions=Object.fromEntries(
      Object.entries(state.constructions).filter(([id,c])=>
        c.owner===viewer.id||state.battlefield?.structures?.some(s=>s.id===id))
       .map(([id,c])=>{
         if(c.owner===viewer.id)return [id,c];
         const {garrisonIds,upgradeQueue,workerIds,renewableFraction,
           nextFireAtMs, ...publicSite}=c;
         return [id,publicSite];
       }));
    if(state.ruins)state.ruins=Object.fromEntries(
      Object.entries(state.ruins).filter(([id,r])=>r.owner===viewer.id||inVision(r.x,r.y)));
    if(state.orders)state.orders=Object.fromEntries(
      Object.entries(state.orders).filter(([id])=>viewer.units.some(u=>u.id===id)));
    delete state.commands;
    delete state.bots;
    delete state.fullCatalog;
    if(state.harvestJobs)state.harvestJobs=Object.fromEntries(
      Object.entries(state.harvestJobs).filter(([id,j])=>j.owner===viewer.id));
    if(state.seaTradeJobs)state.seaTradeJobs=Object.fromEntries(
      Object.entries(state.seaTradeJobs).filter(([id,j])=>j.owner===viewer.id));
    return {playerId:viewer.id,version:this.version,
      nextSequence:session.lastSequence+1,state,checksum:checksum(state)};
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
  // 4.9: local, server-authoritative readiness. This is not matchmaking or identity proof.
  lobbyState(token){
    const session=this.sessions.get(token);
    assert(session,"Unauthorized session");
    return {playerId:session.playerId,hostPlayerId:this.match.players[0].id,
      version:this.version,required:this.lobby.required,started:this.lobby.started,
      players:this.match.players.map(p=>({id:p.id,faction:p.faction,team:p.team,
        ready:this.lobby.ready[p.id]}))};
  }
  setReady(token,ready){
    const session=this.sessions.get(token);
    assert(session,"Unauthorized session");
    assert(this.lobby.required&&!this.lobby.started,"Lobby is not accepting ready changes");
    assert(typeof ready==="boolean","Ready must be a boolean");
    if(this.lobby.ready[session.playerId]!==ready){
      this.lobby.ready[session.playerId]=ready;
      this.version++;
    }
    return this.lobbyState(token);
  }
  startMatch(token){
    const session=this.sessions.get(token);
    assert(session,"Unauthorized session");
    assert(this.lobby.required&&!this.lobby.started,"Match already started or lobby disabled");
    assert(session.playerId===this.match.players[0].id,"Only lobby host may launch");
    assert(this.match.players.every(p=>this.lobby.ready[p.id]),"All players must be ready");
    this.lobby.started=true;
    this.version++;
    return this.lobbyState(token);
  }
  // 5.0: accidental-corruption checked development checkpoint, never a signed credential.
  // Tokens are deliberately NOT serialized; restoration issues fresh credentials.
  checkpoint(){
    const sequences=Object.fromEntries([...this.sessions.values()]
      .map(s=>[s.playerId,s.lastSequence]));
    const payload={save:exportSave(this.match),version:this.version,sequence:this.sequence,
      events:clone(this.events.slice(-5000)),lobby:clone(this.lobby),
      sequences};
    return JSON.stringify({format:"crowns-of-iron-host-checkpoint",version:1,
      integrity:hash(payload),payload});
  }
  static fromCheckpoint(encoded){
    assert(typeof encoded==="string"&&encoded.length<50000000,"Invalid host checkpoint");
    const doc=JSON.parse(encoded),payload=doc?.payload;
    assert(doc?.format==="crowns-of-iron-host-checkpoint"&&doc.version===1&&
      payload&&doc.integrity===hash(payload),"Host checkpoint integrity mismatch");
    const restored=importSave(payload.save);
    assert(Number.isSafeInteger(payload.version)&&payload.version>=0&&
      Number.isSafeInteger(payload.sequence)&&payload.sequence>=0,"Invalid host version");
    assert(Array.isArray(payload.events)&&payload.events.length<=5000&&
      payload.events.every(e=>Number.isSafeInteger(e.version)&&e.version<=payload.version),
      "Invalid host history");
    assert(payload.lobby&&typeof payload.lobby.required==="boolean"&&
      typeof payload.lobby.started==="boolean","Invalid checkpoint lobby");
    const participants=restored.players.map(p=>({id:p.id,faction:p.faction,team:p.team}));
    const host=new MatchHost(participants,restored.seed,
      {requireReady:payload.lobby.required});
    assert(participants.every(p=>typeof payload.lobby.ready?.[p.id]==="boolean"),
      "Missing lobby readiness");
    host.match=restored;
    host.version=payload.version;
    host.sequence=payload.sequence;
    host.events=clone(payload.events);
    host.lobby=clone(payload.lobby);
    for(const session of host.sessions.values()){
      const n=payload.sequences?.[session.playerId];
      assert(Number.isSafeInteger(n)&&n>=0,"Missing player command sequence");
      session.lastSequence=n;
    }
    return host;
  }
  activity(){return this.events.map(e=>({...e}));}
}
