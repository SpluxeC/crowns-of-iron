import {assert} from "./util.js";
import {at} from "./map.js";
import {getPlayer} from "./state.js";

// Explicit finite deposits, 10 units per worker action, two-second cooldown.
// Unlike abstract income this cannot conjure material beyond a map deposit.
export function harvestDeposit(match,owner,workerId,x,y){
  assert(match.battlefield,"No map attached");
  assert(Number.isInteger(x)&&Number.isInteger(y),"Invalid deposit coordinates");
  const player=getPlayer(match,owner);
  const worker=player.units.find(u=>u.id===workerId&&u.alive&&u.archetype==="Worker");
  assert(worker,"Only a living owned Worker may gather");
  assert(Number.isInteger(worker.x)&&Number.isInteger(worker.y),"Worker is not positioned");
  assert(Math.abs(worker.x-x)+Math.abs(worker.y-y)<=1,"Worker is too far from deposit");
  assert((worker.nextHarvestAtMs??0)<=match.elapsedMs,"Worker gathering cooldown");
  const tile=at(match.battlefield,x,y);
  assert(tile&&tile.resource&&tile.amount>0,"Deposit is depleted or missing");
  if(tile.resource==="Metal")assert(player.age!=="I","Metal extraction age locked");
  if(tile.resource==="Aether")assert(["III","IV","V"].includes(player.age),"Aether extraction age locked");
  const result=Math.min(10,tile.amount);
  tile.amount-=result;player.resources[tile.resource]+=result;
  worker.nextHarvestAtMs=match.elapsedMs+2000;
  if(tile.amount===0)tile.resource=null;
  return {resource:tile.resource??"depleted",amount:result,remaining:tile.amount};
}
