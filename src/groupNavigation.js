import {assert} from "./util.js";
import {tileTraversable,movementDomain} from "./movementDomains.js";
import {occupiedCells} from "./unitCollision.js";

const OFFSETS=[[0,0],[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,-1],[1,-1],[-1,1],
 [2,0],[-2,0],[0,2],[0,-2],[2,1],[-2,-1],[2,-1],[-2,1],
 [1,2],[-1,-2],[1,-2],[-1,2],[2,2],[-2,2],[2,-2],[-2,-2]];
const DIR=[[0,-1],[1,0],[0,1],[-1,0]];
const key=(x,y)=>x+","+y;
const split=k=>k.split(",").map(Number);

/** One BFS per unit; reconstruct routes to all formation candidate cells. */
function routes(unit,goalKeys,passable,diagnostics){
 const start=key(unit.x,unit.y),prev=new Map([[start,null]]);
 const q=[{x:unit.x,y:unit.y}],wanted=new Set(goalKeys);
 for(let head=0;head<q.length&&wanted.size;head++){
  const p=q[head],k=key(p.x,p.y);wanted.delete(k);
  if(diagnostics)diagnostics.routeExpansions=(diagnostics.routeExpansions??0)+1;
  for(const [dx,dy] of DIR){
   const x=p.x+dx,y=p.y+dy,next=key(x,y);
   if(prev.has(next)||!passable.has(next))continue;
   prev.set(next,k);q.push({x,y});
  }
 }
 return new Map(goalKeys.filter(k=>prev.has(k)).map(k=>{
  const path=[];let curr=k;
  while(curr!==null){const [x,y]=split(curr);path.push({x,y});curr=prev.get(curr);}
  return [k,path.reverse()];
 }));
}

/** Minimum total shortest-route length among <=24 units and 25 target slots. */
function minimumAssignment(cost){
 const n=cost.length,m=cost[0].length,INF=1e12;
 assert(n<=m,"Formation has insufficient slots");
 const u=Array(n+1).fill(0),v=Array(m+1).fill(0),
  p=Array(m+1).fill(0),way=Array(m+1).fill(0);
 for(let i=1;i<=n;i++){
  p[0]=i;let j0=0;
  const minv=Array(m+1).fill(INF),used=Array(m+1).fill(false);
  do{
   used[j0]=true;
   const i0=p[j0];let delta=INF,j1=0;
   for(let j=1;j<=m;j++)if(!used[j]){
    const cur=cost[i0-1][j-1]-u[i0]-v[j];
    if(cur<minv[j]){minv[j]=cur;way[j]=j0;}
    if(minv[j]<delta){delta=minv[j];j1=j;}
   }
   assert(delta<INF/2,"Formation lacks reachable positions");
   for(let j=0;j<=m;j++){
    if(used[j]){u[p[j]]+=delta;v[j]-=delta;}
    else minv[j]-=delta;
   }
   j0=j1;
  }while(p[j0]!==0);
  do{const j1=way[j0];p[j0]=p[j1];j0=j1;}while(j0);
 }
 const result=Array(n).fill(-1);
 for(let j=1;j<=m;j++)if(p[j])result[p[j]-1]=j-1;
 assert(result.every((j,i)=>j>=0&&cost[i][j]<INF/2),
  "Formation lacks reachable positions");
 return result;
}

export function planFormation(match,owner,units,x,y,{diagnostics=null}={}){
 assert(match?.battlefield,"Battlefield required");
 assert(Number.isInteger(x)&&Number.isInteger(y),"Invalid formation destination");
 assert(Array.isArray(units)&&units.length>0&&units.length<=24&&
   new Set(units.map(u=>u.id)).size===units.length,"Invalid formation units");
 const chosen=[...units].sort((a,b)=>a.id.localeCompare(b.id));
 const goal=OFFSETS.map(([dx,dy])=>({x:x+dx,y:y+dy}));
 const group=new Set(chosen.map(u=>u.id)),occupied=match.unitCollision?occupiedCells(match):null;
 // Compile terrain and stationary non-group occupancy once per unit archetype,
 // rather than rechecking the same tile in up to 24 independent BFS searches.
 const passability=new Map();
 const matrix=[],perUnit=[];
 for(const unit of chosen){
  let passable=passability.get(unit.archetype);
  if(!passable){
   const domain=movementDomain(unit.archetype);
   const blocked=occupied?.[domain]??null;
   passable=new Set();
   for(const tile of match.battlefield.tiles){
    if(diagnostics)diagnostics.terrainChecks=(diagnostics.terrainChecks??0)+1;
    if(blocked&&(blocked.get(key(tile.x,tile.y))??[]).some(id=>!group.has(id)))continue;
    if(tileTraversable(match,owner,unit.archetype,tile.x,tile.y))
     passable.add(key(tile.x,tile.y));
   }
   passability.set(unit.archetype,passable);
   if(diagnostics)diagnostics.passabilityIndexes=(diagnostics.passabilityIndexes??0)+1;
  }
  const available=goal.filter(g=>passable.has(key(g.x,g.y))).map(g=>key(g.x,g.y));
  const found=routes(unit,available,passable,diagnostics);
  perUnit.push(found);
  matrix.push(goal.map((g,i)=>found.has(key(g.x,g.y))
    ?(found.get(key(g.x,g.y)).length-1)*100+i:1e12));
 }
 const assigned=minimumAssignment(matrix);
 const plans=chosen.map((u,i)=>{
  const destination=goal[assigned[i]],path=perUnit[i].get(key(destination.x,destination.y));
  assert(path,"Formation path missing");
  return {unitId:u.id,destination,path};
 });
 // Return in caller order, but commit only after the entire assignment succeeds.
 return units.map(u=>plans.find(p=>p.unitId===u.id));
}
