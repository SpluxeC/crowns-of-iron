import {randomBytes} from "node:crypto";
import {createMatch,command,step,snapshot,checksum} from "./simulation.js";
import {makeMap} from "./map.js";
import {attachBattlefield} from "./battlefield.js";
import {assert,clone} from "./util.js";

// Local authoritative protocol prototype. No public deployment, sockets,
// authentication service or fog-of-war redaction is claimed.
const COMMANDS=new Set(["allocate","research","cancelResearch","train","cancelTrain",
  "move","attack","build","cancelBuild","ability"]);
export class MatchHost{
  constructor(participants,seed=1){
    this.match=createMatch(participants,seed);
    attachBattlefield(this.match,makeMap({players:participants.length,seed}));
    this.sessions=new Map();
    this.events=[];
    this.sequence=0;
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
    const result=command(this.match,order);
    session.lastSequence=sequence;
    this.sequence++;
    this.events.push({sequence:this.sequence,player:session.playerId,action,atMs:this.match.elapsedMs});
    return {accepted:true,sequence,matchChecksum:checksum(this.match),result:result??null};
  }
  advance(ms){
    assert(Number.isSafeInteger(ms)&&ms>0&&ms<=60000,"Invalid host tick");
    step(this.match,ms);
    return {nowMs:this.match.elapsedMs,checksum:checksum(this.match)};
  }
  view(token){
    const session=this.sessions.get(token);
    assert(session,"Unauthorized session");
    // Explicitly incomplete: production must filter enemy units by fog of war.
    return {playerId:session.playerId,state:snapshot(this.match),checksum:checksum(this.match)};
  }
  activity(){return this.events.map(e=>({...e}));}
}
