import {boneForPosition,rotateAroundJointX} from "./rigProfiles.js";
import {sampleAnimationClip} from "./animationClips.js";
/** Lightweight procedural pseudo-rig animation for Y-up OBJ geometry.
 * Not a skinning/armature implementation: vertices are deformed by regions. */
export const ANIMATION_MODES=Object.freeze(["idle","walk","attack"]);
export function poseAt(mode="idle",timeMs=0,offset=0){
 if(!ANIMATION_MODES.includes(mode))throw Error("Unsupported mesh animation");
 if(!Number.isFinite(timeMs)||!Number.isFinite(offset))throw Error("Invalid animation clock");
 const period=mode==="walk"?670:mode==="attack"?460:2100;
 const phase=(timeMs/period+offset)*Math.PI*2;
 const sampled=sampleAnimationClip(mode,timeMs+offset*period);
 return {mode,phase,swing:Math.sin(phase),bounce:Math.abs(Math.sin(phase)),
  recoil:Math.max(0,Math.sin(phase)),boneAngles:sampled.angles};
}
export function animationModeForUnit(unit,order){
 if(!unit?.alive)return "idle";
 if(order?.kind==="attack"||(order?.kind==="attackMove"&&order.engaged))return "attack";
 if(order?.path?.length>0)return "walk";
 return "idle";
}
export function deformVertex(x,y,z,pose,maxHeight=1.5,rig=null){
 if(!pose)return [x,y,z];
 const height=Math.max(.1,maxHeight),t=y/height;
 if(pose.mode==="idle"&&!rig)return [x+.008*t*pose.swing,
  y+.012*pose.bounce,z];
 if(!rig){
  if(pose.mode==="walk")return [x,y+.026*pose.bounce,z+.06*pose.swing*t];
  return [x,y+.016*pose.recoil,z-.08*pose.recoil*t];
 }
 const bone=boneForPosition(x,y,height,rig),
  left=bone.startsWith("left"),right=bone.startsWith("right");
 let angle=0,pivotY=rig.hipY*height;
 if(bone==="leftArm"||bone==="rightArm"){
  pivotY=rig.shoulderY*height;
  angle=pose.mode==="walk"?(left?-1:1)*rig.armSwing*pose.swing:
   (right?-1:1)*rig.attackSwing*pose.recoil;
 }else if(bone==="leftLeg"||bone==="rightLeg"){
  angle=pose.mode==="walk"?(left?1:-1)*rig.legSwing*pose.swing:0;
 }
 if(rig&&pose.boneAngles&&Object.hasOwn(pose.boneAngles,bone))
  angle=pose.boneAngles[bone];
 if(bone==="spine"||bone==="head")
  pivotY=(bone==="head"?rig.headY:rig.hipY)*height;
 const [yy,zz]=rotateAroundJointX(y,z,pivotY,angle);
 return [x,yy+(pose.mode==="walk"?.025*pose.bounce:.014*pose.recoil),
  zz-(pose.mode==="attack"?.03*pose.recoil*t:0)];
}
