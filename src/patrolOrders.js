/** Two-point patrol using existing attack-move targeting and validated paths.
 * Patrol routes are saved in match state for deterministic replay. */
import {assert} from "./util.js";
import {getPlayer} from "./state.js";
import {issueAttackMove} from "./combatDirectives.js";
export function issuePatrol(match,owner,unitId,x,y){
 const player=getPlayer(match,owner),
  unit=player.units.find(u=>u.id===unitId&&u.alive);
 assert(unit&&unit.attack>0&&Number.isInteger(unit.x)&&Number.isInteger(unit.y),
  "Patrol requires a deployed armed unit");
 assert(Number.isInteger(x)&&Number.isInteger(y),"Invalid patrol destination");
 assert(x!==unit.x||y!==unit.y,"Patrol destination must differ from unit location");
 const home={x:unit.x,y:unit.y};
 const result=issueAttackMove(match,owner,unitId,x,y);
 match.patrolRoutes??={};
 match.patrolRoutes[unitId]={owner,home,away:{x,y},next:"home"};
 return {...result,home};
}
export function cancelPatrol(match,id){
 if(match.patrolRoutes)delete match.patrolRoutes[id];
}
export function tickPatrolRoutes(match){
 for(const [unitId,route] of Object.entries(match.patrolRoutes??{}).sort(([a],[b])=>
  a.localeCompare(b))){
  const player=match.players.find(p=>p.id===route.owner);
  const unit=player?.units.find(u=>u.id===unitId&&u.alive);
  if(!unit||player.defeated){delete match.patrolRoutes[unitId];continue;}
  const active=match.orders?.[unitId];
  if(active)continue; // Attack-move is engaged or still following its path.
  const point=route.next==="home"?route.home:route.away;
  try{
   issueAttackMove(match,route.owner,unitId,point.x,point.y);
   route.next=route.next==="home"?"away":"home";
  }catch{
   // If path becomes blocked during a match, allow a later tick to retry.
  }
 }
}
