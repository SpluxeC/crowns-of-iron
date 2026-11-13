/** Explicit per-frame art budgets; preserve server and camera-visible models. */
export const ART_BUDGETS=Object.freeze({
 detailedUnits:160,damageFinishes:72,combatBursts:64,
 maxBurstVertices:64*24
});
export function createArtFrameBudget(overrides={}){
 if(Object.keys(overrides).some(key=>!(key in ART_BUDGETS))||
  Object.values(overrides).some(v=>!Number.isSafeInteger(v)||v<0))
  throw Error("Invalid art budget");
 const limit={...ART_BUDGETS,...overrides};
 const consumed={damageFinishes:0,combatBursts:0};
 return {
  claim(effect){
   if(!(effect in consumed))throw Error("Invalid budget effect");
   if(consumed[effect]>=limit[effect])return false;
   consumed[effect]++;return true;
  },
  stats(){return {...consumed,limits:{...limit},
   burstVerticesUpperBound:limit.combatBursts*24};}
 };
}
