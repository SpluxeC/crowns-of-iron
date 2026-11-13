/** Stateless, bounded low-poly combat flashes. Called only for visible filtered units.
 * Attack flashes indicate an attack animation, not server-confirmed projectile fire. */
export const COMBAT_VFX_LIMIT=160;
export function combatVfxDescriptor(unit,{clip="idle",hit=0,death=0,preview=false}={},now=0){
 if(!unit||!Number.isFinite(now)||![hit,death].every(v=>Number.isFinite(v)&&v>=0&&v<=1))
  throw Error("Invalid combat VFX parameters");
 if(death>0){
  return {kind:"death",intensity:Math.max(0,1-death),size:.36+death*.4,
   color:"#d36b43",offset:[0,.55,0]};
 }
 if(hit>0)return {kind:"hit",intensity:hit,size:.19+hit*.24,
  color:"#ffc386",offset:[0,.95,0]};
 if(clip!=="attack")return null;
 // 700 ms reference attack cycle, short flash so repeated visuals stay bounded.
 const phase=((now%700)+700)%700;
 if(phase>=115&&!preview)return null;
 return {kind:"muzzle",intensity:preview?1:1-phase/115,
  size:.13,color:"#ffe29a",offset:[0,1.05,.43]};
}
export function appendCombatVfx(out,cx,cy,cz,descriptor){
 if(!descriptor||descriptor.intensity<=0)return 0;
 if(!Array.isArray(out)||![cx,cy,cz].every(Number.isFinite))
  throw Error("Invalid combat VFX vertices");
 const [ox,oy,oz]=descriptor.offset,
  r=descriptor.size*Math.max(.15,descriptor.intensity);
 const p=[cx+ox,cy+oy,cz+oz],c=descriptor.color;
 if(!/^#[a-fA-F0-9]{6}$/.test(c)||!Number.isFinite(r)||r<=0)
  throw Error("Invalid combat VFX descriptor");
 const rgb=[1,3,5].map(i=>parseInt(c.slice(i,i+2),16)/255);
 // Octahedral burst: 8 triangles, 24 vertices, no unbounded particles or timers.
 const top=[p[0],p[1]+r,p[2]],bottom=[p[0],p[1]-r,p[2]],
  ring=[[p[0]+r,p[1],p[2]],[p[0],p[1],p[2]+r],
   [p[0]-r,p[1],p[2]],[p[0],p[1],p[2]-r]];
 for(let k=0;k<4;k++)for(const tri of [
  [top,ring[k],ring[(k+1)%4]],[bottom,ring[(k+1)%4],ring[k]]]){
  for(const xyz of tri)out.push(...xyz,...rgb);
 }
 return 24;
}
