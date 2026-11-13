/** Stylized gameplay-neutral damage recipes for humanoids and vehicle families. */
import {factionSlug} from "./factionArt.js";
import {wearLevel} from "./battleWear.js";
const PROFILES=Object.freeze({
 humanoid:{soot:.23,scorch:.24,edge:.10},
 siege:{soot:.42,scorch:.29,edge:.20},
 naval:{soot:.28,scorch:.38,edge:.14},
 air:{soot:.39,scorch:.36,edge:.18}
});
const clamp=x=>Math.max(0,Math.min(1,x));
export function damageProfile(domain="humanoid",faction="Humans"){
 const profile=PROFILES[domain],slug=factionSlug(faction);
 if(!profile||!slug)throw Error("Unknown damage finish identity");
 const accents={
 humans:[.65,.45,.25],orcs:[.51,.38,.20],dwarfs:[.70,.52,.30],
 "tree-elves":[.39,.57,.31],"corrupt-elves":[.52,.31,.55],ursa:[.63,.66,.70]
 };
 return {...profile,accent:accents[slug]};
}
/** Applies deterministic wear to vertex colors (including UV-rendered glTF models).
 * Never edits original source geometry, HP, UVs, or server state. */
export function applyDamageFinish(mesh,hp,maxHp,{domain="humanoid",faction="Humans",seed=0}={}){
 const amount=wearLevel(hp,maxHp),profile=damageProfile(domain,faction);
 if(!mesh?.vertices||mesh.vertices.length%6!==0||
  !Number.isSafeInteger(seed)||seed<0)throw Error("Invalid damaged art mesh");
 if(amount<.03)return mesh;
 const out=new Float32Array(mesh.vertices),src=mesh.vertices;
 for(let i=0;i<src.length;i+=6){
  const triangle=Math.floor(i/18);
  const grain=((Math.imul(triangle+1+seed,1103515245)>>>0)%1021)/1020;
  const shadow=amount*(profile.soot+grain*profile.scorch);
  for(let k=0;k<3;k++){
   const scratch=profile.edge*amount*profile.accent[k]*(.12+(amount>.6&&grain>.78?1:0));
   out[i+3+k]=clamp(src[i+3+k]*(1-shadow)+scratch);
  }
 }
 return {...mesh,vertices:out,damageFinish:amount};
}
