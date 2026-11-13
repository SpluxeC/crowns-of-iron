/** Static terrain-only environmental accents; no hidden fog tiles, no particles. */
const BIOME=Object.freeze({
 grass:{color:"#71945e",secondary:"#9aac70"},
 forest:{color:"#345c43",secondary:"#648663"},
 hill:{color:"#89928c",secondary:"#a3a99a"},
 water:{color:"#51839a",secondary:"#739eae"},
 deposit:{color:"#d8c37a",secondary:"#a5a89c"}
});
export const ENVIRONMENT_DETAILS_CAP=256;
function hash(x,y){let n=Math.imul(x+103,73856093)^Math.imul(y+19,19349663);
 return (Math.imul(n^(n>>>13),1274126177)>>>0);}
export function terrainAccent(tile){
 if(!tile||!Number.isInteger(tile.x)||!Number.isInteger(tile.y))
  throw Error("Invalid terrain art tile");
 if(tile.terrain==="unknown"||!BIOME[tile.terrain])return null;
 const n=hash(tile.x,tile.y);
 if(n%3!==0)return null;
 const x=tile.x+.18+((n>>>3)%6)*.095,
  z=tile.y+.16+((n>>>7)%6)*.1,
  water=tile.terrain==="water",minY=water?-.31:
  tile.terrain==="hill"?2.22:.14;
 return {x,z,width:water?.16:.075,height:water?.012:.12,
  bottom:minY,color:n%2?BIOME[tile.terrain].color:BIOME[tile.terrain].secondary};
}
export function appendTerrainAccents(out,tiles,emit,limit=ENVIRONMENT_DETAILS_CAP){
 if(!Array.isArray(out)||!Array.isArray(tiles)||typeof emit!=="function"||
  !Number.isSafeInteger(limit)||limit<0||limit>ENVIRONMENT_DETAILS_CAP)
  throw Error("Invalid terrain accent request");
 let count=0;
 for(const tile of tiles){
  if(count>=limit)break;
  const accent=terrainAccent(tile);
  if(!accent)continue;
  emit(out,accent.x,accent.z,accent.width,accent.bottom,
   accent.bottom+accent.height,accent.color);
  count++;
 }
 return count;
}
