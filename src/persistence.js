import {assert,hash,clone} from "./util.js";
import {createMatch,step,command} from "./simulation.js";
const VERSION=1;
export function exportSave(match){
  assert(match&&Array.isArray(match.players)&&Number.isSafeInteger(match.elapsedMs),"Invalid match");
  const state=clone(match);
  return JSON.stringify({format:"crowns-of-iron-match",version:VERSION,checksum:hash(state),state});
}
export function importSave(encoded){
  assert(typeof encoded==="string"&&encoded.length<20000000,"Invalid save input");
  const item=JSON.parse(encoded);
  assert(item?.format==="crowns-of-iron-match"&&item.version===VERSION,"Unsupported save version");
  assert(item.state&&hash(item.state)===item.checksum,"Save checksum mismatch");
  assert(Array.isArray(item.state.players)&&item.state.players.length>=2&&item.state.players.length<=8,"Invalid player count");
  for(const player of item.state.players){
    assert(player.popUsed>=0&&player.popCap<=300&&player.popUsed<=300,"Invalid player population");
    for(const count of Object.values(player.resources??{}))assert(Number.isSafeInteger(count)&&count>=0,"Invalid resource count");
  }
  return clone(item.state);
}
export function replayEvents(participants,seed,entries){
  assert(Array.isArray(entries),"Invalid replay commands");
  const m=createMatch(participants,seed);
  for(const e of entries){
    if(e.type==="tick")step(m,e.ms);
    else if(e.type==="command")command(m,e.order);
    else throw new Error("Invalid replay event");
  }
  return m;
}
export function eventRecorder(participants,seed=1){
  let match=createMatch(participants,seed);
  const entries=[];
  return {
    get match(){return match;},
    command(order){const r=command(match,order);entries.push({type:"command",order:clone(order)});return r;},
    step(ms){step(match,ms);entries.push({type:"tick",ms});},
    export(){return {participants:clone(participants),seed,entries:clone(entries),finalChecksum:hash(match)};},
    verify(){const replayed=replayEvents(participants,seed,entries);return hash(match)===hash(replayed);}
  };
}
