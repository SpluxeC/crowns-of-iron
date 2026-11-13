/** Pure command builder for the host's atomic 1..16 command batch endpoint. */
export const MAX_BATCH=16;
export function stopOrders(player,selected,nextSequence=1){
 const owned=new Set((player?.units??[]).filter(u=>u.alive).map(u=>u.id));
 const eligible=[...new Set(selected)].filter(id=>owned.has(id)).slice(0,MAX_BATCH);
 return eligible.map((unitId,index)=>({sequence:nextSequence+index,
  action:"stop",payload:{unitId}}));
}
export function attackOrders(player,selected,targetPlayer,targetId,nextSequence=1){
 if(typeof targetPlayer!=="string"||!targetPlayer||
    typeof targetId!=="string"||!targetId)return [];
 const attackers=new Set((player?.units??[]).filter(u=>u.alive&&u.attack>0&&
   Number.isInteger(u.x)&&Number.isInteger(u.y)&&!u.embarkedAt&&!u.garrisonedAt)
   .map(u=>u.id));
 return [...new Set(selected)].filter(id=>attackers.has(id)).slice(0,MAX_BATCH)
  .map((attacker,index)=>({sequence:nextSequence+index,
   action:"attack",payload:{attacker,targetPlayer,target:targetId}}));
}
export function selectedVisibleEnemy(state,playerId,x,y){
 const own=state?.players?.find(p=>p.id===playerId);
 if(!own)return null;
 for(const p of state.players){
  if(p.id===playerId||p.team===own.team)continue;
  const target=(p.units??[]).find(u=>u.alive&&u.x===x&&u.y===y);
  if(target)return {targetPlayer:p.id,targetId:target.id};
 }
 return null;
}
