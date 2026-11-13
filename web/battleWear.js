/** Deterministic client-side battle-wear overlay. No changes to glTF exports or HP. */
export function wearLevel(hp,maxHp){
 if(!Number.isFinite(hp)||!Number.isFinite(maxHp)||maxHp<=0)
  throw Error("Invalid cosmetic health");
 return Math.max(0,Math.min(1,1-Math.max(0,hp)/maxHp));
}
export function applyBattleWear(mesh,hp,maxHp,{seed=0}={}){
 if(!mesh?.vertices||mesh.vertices.length%6!==0||
  !Number.isInteger(seed)||seed<0)throw Error("Invalid battle-wear mesh");
 const wear=wearLevel(hp,maxHp);
 if(wear<.03)return mesh;
 const src=mesh.vertices,out=new Float32Array(src);
 // Stable mottled damage varies by triangle instead of flickering by time.
 for(let i=0;i<src.length;i+=6){
  const face=Math.floor(i/18);
  const noise=((Math.imul(face+seed+1,2654435761)>>>0)%997)/997;
  const dark=wear*(.18+.38*noise);
  out[i+3]=Math.max(0,src[i+3]*(1-dark));
  out[i+4]=Math.max(0,src[i+4]*(1-dark));
  out[i+5]=Math.max(0,src[i+5]*(1-dark));
  if(wear>.55&&noise>.77){
   out[i+3]=Math.min(1,out[i+3]+.15*wear); // exposed orange-brown edge tint
   out[i+4]*=.87;out[i+5]*=.72;
  }
 }
 return {...mesh,vertices:out,battleWear:wear};
}
