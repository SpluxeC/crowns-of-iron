/** Pure, browser-safe RTS selection helpers. Never modify authoritative state. */
export function selectableUnits(player){
 return (player?.units??[]).filter(u=>u.alive&&Number.isInteger(u.x)&&
  Number.isInteger(u.y)&&!u.garrisonedAt&&!u.embarkedAt);
}
export function unitsInTileRectangle(player,from,to,{limit=24}={}){
 if(!from||!to)return [];
 const left=Math.min(from.x,to.x),right=Math.max(from.x,to.x);
 const top=Math.min(from.y,to.y),bottom=Math.max(from.y,to.y);
 return selectableUnits(player).filter(u=>u.x>=left&&u.x<=right&&
  u.y>=top&&u.y<=bottom).sort((a,b)=>a.id.localeCompare(b.id)).slice(0,limit).map(u=>u.id);
}
export function updateSelection(oldSelection,ids,{add=false,toggle=false,limit=24}={}){
 const set=new Set(add||toggle?oldSelection:[]);
 for(const id of ids){
  if(toggle&&set.has(id)){set.delete(id);continue;}
  if(set.size<limit)set.add(id);
 }
 return set;
}
export function chooseAtTile(player,tile){
 if(!tile)return null;
 return selectableUnits(player).find(u=>u.x===tile.x&&u.y===tile.y)??null;
}
export function selectByRole(player,role,{limit=24}={}){
 return selectableUnits(player).filter(u=>role==="workers"?u.archetype==="Worker":
  role==="military"?u.archetype!=="Worker":u.archetype===role)
  .sort((a,b)=>a.id.localeCompare(b.id)).slice(0,limit).map(u=>u.id);
}
export function recallGroup(player,ids,{limit=24}={}){
 const alive=new Set(selectableUnits(player).map(u=>u.id));
 return [...new Set(ids)].filter(id=>alive.has(id)).slice(0,limit);
}
export function makeFormationPayload(selected,x,y){
 if(!Number.isInteger(x)||!Number.isInteger(y))return null;
 const units=[...selected].slice(0,24);
 return units.length?{units,x,y}:null;
}
