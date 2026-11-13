/** Deterministic fourfold upsampling/detail pass on original faction PPM patterns.
 * High-frequency surface stippling and a narrow fabric/metal hatch are stylized
 * texture detail, not photo-based authored PBR maps or physically based lighting. */
export function refineFactionTexture(src,faction="",factor=4){
 if(!src?.pixels||!Number.isInteger(factor)||factor<1||factor>4||
  src.width*factor>256||src.height*factor>256)
  throw Error("Invalid faction texture refinement");
 const width=src.width*factor,height=src.height*factor,
  pixels=new Uint8Array(width*height*3);
 let hash=2166136261;
 for(const char of String(faction))hash=Math.imul(hash^char.charCodeAt(0),16777619)>>>0;
 const get=(x,y,c)=>src.pixels[(
  (Math.max(0,Math.min(src.height-1,y))*src.width)+
   Math.max(0,Math.min(src.width-1,x)))*3+c];
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  const xx=x/factor,yy=y/factor,
   x0=Math.floor(xx),y0=Math.floor(yy),
   fx=xx-x0,fy=yy-y0;
  const grain=(((Math.imul(x+71,73856093)^Math.imul(y+13,19349663)^hash)>>>0)%11)-5;
  const hatch=((x+y+(hash&7))%23===0)?-7:0;
  for(let c=0;c<3;c++){
   const a=get(x0,y0,c)*(1-fx)+get(x0+1,y0,c)*fx;
   const b=get(x0,y0+1,c)*(1-fx)+get(x0+1,y0+1,c)*fx;
   pixels[(y*width+x)*3+c]=Math.max(0,Math.min(255,
    Math.round(a*(1-fy)+b*fy+grain*.8+hatch)));
  }
 }
 return {width,height,pixels};
}
export function roleMaterialProfile(role){
 if(role==="Worker"||role==="Healer")return {metallicFactor:.02,roughnessFactor:.94};
 if(role==="Hero"||role==="Pikeman")return {metallicFactor:.32,roughnessFactor:.56};
 if(role==="Archer")return {metallicFactor:.06,roughnessFactor:.86};
 return {metallicFactor:.12,roughnessFactor:.82};
}
