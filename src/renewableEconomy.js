import {researchMultiplier} from "./technologyEffects.js";
const OUTPUTS={
  Farm:{resource:"Food",per10Seconds:20,modifier:"farmOutput"},
  Forester:{resource:"Wood",per10Seconds:16,modifier:"foresterOutput"},
  "Aether Condenser":{resource:"Aether",per10Seconds:3,modifier:"aetherOutput"}
};
// Renewable production runs only in spatial-economy mode. Abstract mode
// retains v0.2 economic benchmark behavior unchanged.
export function tickRenewables(match,deltaMs){
 if(match.economyMode!=="spatial")return [];
 const produced=[];
 for(const site of Object.values(match.constructions??{}).sort((a,b)=>a.siteId.localeCompare(b.siteId))){
  const recipe=OUTPUTS[site.kind];
  if(!recipe||!site.completed)continue;
  const p=match.players.find(x=>x.id===site.owner);
  if(!p||p.defeated)continue;
  site.renewableProgressMs=(site.renewableProgressMs??0)+deltaMs;
  site.renewableFraction??=0;
  while(site.renewableProgressMs>=10000){
   site.renewableProgressMs-=10000;
   const raw=recipe.per10Seconds*researchMultiplier(p,recipe.modifier)*(site.localRenewableMultiplier??1);
   const amount=Math.floor(raw+site.renewableFraction+1e-9);
   site.renewableFraction+=raw-amount;
   if(amount>0){p.resources[recipe.resource]+=amount;produced.push({owner:p.id,kind:site.kind,resource:recipe.resource,amount});}
  }
 }
 return produced;
}
