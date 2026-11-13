/** Lightweight procedural pseudo-rig animation for Y-up OBJ geometry.
 * Not a skinning/armature implementation: vertices are deformed by regions. */
export const ANIMATION_MODES=Object.freeze(["idle","walk","attack"]);
export function poseAt(mode="idle",timeMs=0,offset=0){
 if(!ANIMATION_MODES.includes(mode))throw Error("Unsupported mesh animation");
 if(!Number.isFinite(timeMs)||!Number.isFinite(offset))throw Error("Invalid animation clock");
 const period=mode==="walk"?670:mode==="attack"?460:2100;
 const phase=(timeMs/period+offset)*Math.PI*2;
 return {mode,phase,swing:Math.sin(phase),bounce:Math.abs(Math.sin(phase)),
  recoil:Math.max(0,Math.sin(phase))};
}
export function animationModeForUnit(unit,order){
 if(!unit?.alive)return "idle";
 if(order?.kind==="attack"||(order?.kind==="attackMove"&&order.engaged))return "attack";
 if(order?.path?.length>0)return "walk";
 return "idle";
}
export function deformVertex(x,y,z,pose,maxHeight=1.5){
 if(!pose)return [x,y,z];
 const height=Math.max(0.1,maxHeight);
 const t=y/height;
 if(pose.mode==="idle")return [x+.008*t*pose.swing,
  y+.012*pose.bounce,z];
 if(pose.mode==="walk"){
  const leg=t<.36&&Math.abs(x)>.07?Math.sign(x)*pose.swing*.1:0;
  const arm=t>.36&&t<.82&&Math.abs(x)>.28?-Math.sign(x)*pose.swing*.08:0;
  return [x,y+.026*pose.bounce+leg*.2,z+leg+arm];
 }
 return [x,y+.016*pose.recoil,z-.08*pose.recoil*t];
}
