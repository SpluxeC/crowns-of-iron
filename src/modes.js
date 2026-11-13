import {assert} from "./util.js";
const VALID=["Conquest","GreatMonument","KingOfHill","TimedScore"];
export function configureMode(match,mode="Conquest",{durationMs=2700000,monumentHoldMs=900000,hillHoldMs=600000}={}){
  assert(VALID.includes(mode),"Unknown victory mode");
  for(const v of [durationMs,monumentHoldMs,hillHoldMs])assert(Number.isSafeInteger(v)&&v>0,"Invalid victory duration");
  assert(match.elapsedMs===0,"Cannot change mode after simulation starts");
  match.mode=mode;
  match.modeState={
    durationMs,monumentHoldMs,hillHoldMs,
    monuments:{},hillTeams:[],hillScore:{},timedScore:{},events:[]
  };
  return match.modeState;
}
function state(match){
  if(!match.modeState)configureMode(match,match.mode??"Conquest");
  return match.modeState;
}
function player(match,id){
  const p=match.players.find(p=>p.id===id);
  assert(p&&!p.defeated,"Unknown or defeated player");return p;
}
export function addMonument(match,id){
  assert(match.mode==="GreatMonument","Monument requires GreatMonument mode");
  const p=player(match,id);assert(p.age==="V","Monument requires Age V");
  const s=state(match);
  assert(!s.monuments[id],"Monument already exists");
  // The actual construction and resource expenditure will come from the construction system.
  s.monuments[id]={remainingMs:s.monumentHoldMs,active:true};
  return s.monuments[id];
}
export function removeMonument(match,id){
  const s=state(match);assert(s.monuments[id],"Monument not found");delete s.monuments[id];
}
export function setHillPresence(match,ids){
  assert(match.mode==="KingOfHill","Hill control requires KingOfHill mode");
  assert(Array.isArray(ids),"Invalid hill presence");
  const s=state(match);
  const unique=[...new Set(ids)];
  for(const id of unique)player(match,id);
  s.hillTeams=[...new Set(unique.map(id=>player(match,id).team))].sort();
}
export function addTimedPoints(match,id,points){
  assert(match.mode==="TimedScore","Timed points require TimedScore mode");
  assert(Number.isSafeInteger(points)&&points>=0&&points<=10000,"Invalid score");
  const p=player(match,id),s=state(match);
  s.timedScore[p.team]=(s.timedScore[p.team]??0)+points;
}
function winnerByScore(match,scoring){
  const teams=[...new Set(match.players.map(p=>p.team))].sort();
  const ranked=teams.map(team=>[team,scoring[team]??0]).sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0]));
  // Explicit tie: no arbitrary win awarded. For now, outcome is a draw.
  return ranked.length>1&&ranked[0][1]===ranked[1][1]?"draw":ranked[0]?.[0]??"draw";
}
export function tickMode(match,deltaMs){
  assert(Number.isSafeInteger(deltaMs)&&deltaMs>=0,"Invalid victory tick");
  if(match.winner!==null||match.mode==="Conquest")return match.winner;
  const s=state(match);
  if(match.mode==="GreatMonument"){
    for(const id of Object.keys(s.monuments).sort()){
      const monument=s.monuments[id];if(!monument.active)continue;
      const owner=match.players.find(p=>p.id===id);
      if(!owner||owner.defeated)continue;
      monument.remainingMs-=deltaMs;
      if(monument.remainingMs<=0){monument.remainingMs=0;match.winner=owner.team;s.events.push("Monument victory "+owner.team);break;}
    }
  }
  if(match.mode==="KingOfHill"&&s.hillTeams.length===1){
    const team=s.hillTeams[0];
    s.hillScore[team]=(s.hillScore[team]??0)+deltaMs;
    if(s.hillScore[team]>=s.hillHoldMs){match.winner=team;s.events.push("Hill victory "+team);}
  }
  if(match.mode==="TimedScore"&&match.elapsedMs+deltaMs>=s.durationMs){
    match.winner=winnerByScore(match,s.timedScore);s.events.push("Timed result "+match.winner);
  }
  return match.winner;
}
