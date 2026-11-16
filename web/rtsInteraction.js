/** Browser-only RTS interaction helpers. Pure logic for testing without WebGL. */
export const MAX_SELECTION=24;
export const TOOL_MODES=Object.freeze(["select","move","attack","attackMove","formation","harvest","build"]);
export function clampSelection(ids,allowed,append=false,current=[]){
 const allowedIds=new Set(allowed),next=append?new Set(current):new Set();
 for(const id of ids)if(allowedIds.has(id)){
  if(append&&next.has(id))next.delete(id);else if(next.size<MAX_SELECTION)next.add(id);
 }
 return [...next];
}
export function rectangleUnits(players,world,pose,rect,w,h,projection){
 const left=Math.min(rect.x1,rect.x2),right=Math.max(rect.x1,rect.x2),
  top=Math.min(rect.y1,rect.y2),bottom=Math.max(rect.y1,rect.y2);
 return (players.find(p=>p.id==="human")?.units??[])
  .filter(u=>u.alive&&Number.isInteger(u.x)&&Number.isInteger(u.y))
  .filter(u=>{
   const p=projection(u,world,pose,w,h);
   return p&&p.x>=left&&p.x<=right&&p.y>=top&&p.y<=bottom;
  }).map(u=>u.id).slice(0,MAX_SELECTION);
}
export function smartOrder({selected,units,hit,tile,terrain,modifier=false}){
 if(!selected?.length||!tile)return [];
 const troops=units.filter(u=>selected.includes(u.id));
 if(hit?.kind==="unit"&&hit.unit.side!=="human"){
  return troops.map(u=>({action:"attack",attacker:u.id,
   targetPlayer:hit.unit.side,target:hit.unit.id}));
 }
 if(hit?.kind==="structure"&&hit.site.owner!=="human"){
  return troops.filter(u=>u.archetype!=="Worker").map(u=>({
   action:"attackStructure",unitId:u.id,siteId:hit.site.id}));
 }
 if(terrain?.resource){
  return troops.filter(u=>u.archetype==="Worker").map(u=>({
   action:"assignHarvest",workerId:u.id,x:tile.x,y:tile.y}));
 }
 if(modifier)return troops.filter(u=>u.archetype!=="Worker")
  .map(u=>({action:"attackMove",unitId:u.id,x:tile.x,y:tile.y}));
 if(troops.length>1)return [{action:"formation",units:troops.map(u=>u.id),
  x:tile.x,y:tile.y}];
 return troops.map(u=>({action:"move",unitId:u.id,x:tile.x,y:tile.y}));
}
export function placementValid(world,x,y,footprint){
 const [width,height]=footprint??[];
 if(!Number.isInteger(x)||!Number.isInteger(y)||!Number.isInteger(width)||
  !Number.isInteger(height)||width<1||height<1)return false;
 for(let dy=0;dy<height;dy++)for(let dx=0;dx<width;dx++){
  const xx=x+dx,yy=y+dy;
  const tile=world?.tiles?.[yy*world.width+xx];
  if(!tile||xx<0||yy<0||xx>=world.width||yy>=world.height||
   tile.terrain!=="grass"||tile.occupied)return false;
 }
 return true;
}
export function summarizeOrderError(message){
 return String(message??"Command failed").slice(0,180);
}
