import {assert} from "./util.js";
import {at,walkable} from "./map.js";
const directions=[[0,-1],[1,0],[0,1],[-1,0]];
const key=(x,y)=>x+","+y;
export function hasLineOfSight(map,from,to){
 assert(at(map,from.x,from.y)&&at(map,to.x,to.y),"Line endpoints outside battlefield");
 // Bresenham integer grid traversal; intermediate hills and built structures block
 // direct ranged attacks. Units themselves don't block until collision is modeled.
 let x=from.x,y=from.y,dx=Math.abs(to.x-x),dy=Math.abs(to.y-y);
 const sx=x<to.x?1:-1,sy=y<to.y?1:-1;let error=dx-dy;
 while(x!==to.x||y!==to.y){
   const twice=2*error;
   if(twice>-dy){error-=dy;x+=sx;}
   if(twice<dx){error+=dx;y+=sy;}
   if(x===to.x&&y===to.y)break;
   const t=at(map,x,y);
   if(!t||t.terrain==="hill"||t.occupied!==null)return false;
 }
 return true;
}
export function findAttackApproach(map,from,target,range){
 assert(Number.isFinite(range)&&range>0,"Invalid attack range");
 assert(at(map,from.x,from.y)&&at(map,target.x,target.y),"Attack target outside map");
 const q=[{x:from.x,y:from.y}],seen=new Set([key(from.x,from.y)]),previous=new Map();
 for(let n=0;n<q.length;n++){
   const p=q[n],distance=Math.abs(p.x-target.x)+Math.abs(p.y-target.y);
   if(distance>=1&&distance<=range&&(range<=1||hasLineOfSight(map,p,target))){
     const path=[p];let cur=key(p.x,p.y);
     while(previous.has(cur)){const parent=previous.get(cur),[x,y]=parent.split(",").map(Number);
       path.push({x,y});cur=parent;}
     return path.reverse();
   }
   for(const [dx,dy] of directions){
     const x=p.x+dx,y=p.y+dy,k=key(x,y);
     if(!seen.has(k)&&walkable(map,x,y)){seen.add(k);previous.set(k,key(p.x,p.y));q.push({x,y});}
   }
 }
 return null;
}
