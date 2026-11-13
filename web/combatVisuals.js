/** All reactions are cosmetic and use ONLY entities in the filtered snapshot. */
export const HIT_FLASH_MS=220,DEATH_POSE_MS=650;
export function trackCombatVisual(last,unit,now){
 if(!unit||!Number.isFinite(now))throw Error("Invalid combat visual event");
 const previous=last??{hp:unit.hp,alive:unit.alive,hitAt:null,deathAt:null};
 return {hp:unit.hp,alive:unit.alive,
  hitAt:unit.hp<previous.hp?now:previous.hitAt,
  deathAt:previous.alive&&unit.alive===false?now:previous.deathAt};
}
export function combatVisualPose(state,now){
 const hit=state?.hitAt!=null&&now>=state.hitAt?
  Math.max(0,1-(now-state.hitAt)/HIT_FLASH_MS):0;
 const death=state?.deathAt!=null&&now>=state.deathAt?
  Math.min(1,(now-state.deathAt)/DEATH_POSE_MS):0;
 return {hit,death,finished:state?.deathAt!=null&&death>=1};
}
export function applyCombatPose(mesh,{hit=0,death=0}={}){
 if(!mesh?.vertices||![hit,death].every(x=>Number.isFinite(x)&&x>=0&&x<=1))
  throw Error("Invalid combat pose");
 if(!hit&&!death)return mesh;
 const src=mesh.vertices,out=new Float32Array(src.length),angle=death*1.33;
 for(let i=0;i<src.length;i+=6){
  const c=Math.cos(angle),s=Math.sin(angle);
  out[i]=src[i];out[i+1]=src[i+1]*c-src[i+2]*s-death*.43-hit*.04;
  out[i+2]=src[i+1]*s+src[i+2]*c+hit*.045;
  out[i+3]=Math.min(1,src[i+3]+hit*.65)*(1-death*.45);
  out[i+4]=src[i+4]*(1-hit*.6)*(1-death*.6);
  out[i+5]=src[i+5]*(1-hit*.6)*(1-death*.6);
 }
 return {...mesh,vertices:out};
}
export function visibleCombatUnits(players,states,now){
 const result=[],visible=new Set();
 for(const player of players??[])for(const unit of player.units??[]){
  if(!Number.isInteger(unit.x)||!Number.isInteger(unit.y)||
   unit.embarkedAt||unit.garrisonedAt)continue;
  const key=player.id+"/"+unit.id;visible.add(key);
  const state=trackCombatVisual(states.get(key),unit,now);
  states.set(key,state);
  const effect=combatVisualPose(state,now);
  if(unit.alive||unit.alive===false&&state.deathAt!=null&&!effect.finished)
   result.push({player,unit,effect});
 }
 for(const key of states.keys())if(!visible.has(key))states.delete(key);
 return result;
}
