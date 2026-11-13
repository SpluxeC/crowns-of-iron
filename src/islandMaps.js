import {makeCoastalMap,verifySeaConnectivity} from "./coastal.js";
import {at} from "./map.js";
import {assert} from "./util.js";
function water(map,x,y){
 const t=at(map,x,y);
 if(t){t.terrain="water";t.resource=null;t.amount=0;t.occupied=null;}
}
/**
 * Opt-in island basin: a central island enclosed by a continuous navigable sea,
 * and a channel linking its water ring to the existing coastal sea.
 * Original land and coastal map generators remain unchanged.
 */
export function makeIslandMap({width=64,height=64,seed=1,players=2}={}){
 assert(width>=48&&height>=48,"Island maps require at least 48x48");
 const map=makeCoastalMap({width,height,seed,players});
 const cx=Math.floor(width/2),cy=Math.floor(height/2);
 const half=7;
 // Protected central island and its water ring, with a connection north to sea.
 for(let y=cy-half;y<=cy+half;y++)for(let x=cx-half;x<=cx+half;x++){
  const border=Math.abs(x-cx)>=half-2||Math.abs(y-cy)>=half-2;
  if(border)water(map,x,y);
 }
 for(let y=1;y<=cy-half+2;y++)for(let x=cx+half-2;x<=cx+half;x++)water(map,x,y);
 // Preserve all start tiles and guaranteed immediate worker resources.
 for(const start of map.starts){
  for(let dy=-3;dy<=3;dy++)for(let dx=-3;dx<=3;dx++){
   const t=at(map,start.x+dx,start.y+dy);
   if(t?.terrain==="water"&&Math.abs(dx)<=2&&Math.abs(dy)<=2){
    t.terrain="grass";t.resource=null;t.amount=0;
   }
  }
 }
 map.islandMap=true;
 map.fishShoals=[
   {x:Math.floor(width/4),y:height-1,amount:240},
   {x:Math.floor(width*3/4),y:height-1,amount:240},
   {x:cx,y:cy-half,amount:360}
 ];
 map.navalObjectives=[{id:"central-lagoon",x:cx,y:cy-half},
   {id:"north-approach",x:cx,y:1}];
 const sea=verifySeaConnectivity(map);
 // This property is needed by a playable navy; fail rather than mislabel a map.
 assert(sea.connected,"Island generator created disconnected sea lanes");
 return map;
}
