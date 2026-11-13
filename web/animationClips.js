import {RIG_BONE_NAMES} from "./rigProfiles.js";
/** Original re-usable 7-joint animation curves, artist-editable keyframes. */
export const ANIMATION_CLIPS=Object.freeze({
 "idle": {
  "durationMs": 2400,
  "loop": true,
  "keyframes": [
   {
    "t": 0,
    "angles": {
     "root": 0,
     "spine": 0,
     "head": 0,
     "leftArm": 0,
     "rightArm": 0,
     "leftLeg": 0,
     "rightLeg": 0
    }
   },
   {
    "t": 0.25,
    "angles": {
     "root": 0,
     "spine": 0.035,
     "head": 0.012,
     "leftArm": 0.025,
     "rightArm": -0.025,
     "leftLeg": 0,
     "rightLeg": 0
    }
   },
   {
    "t": 0.5,
    "angles": {
     "root": 0,
     "spine": 0,
     "head": 0,
     "leftArm": 0,
     "rightArm": 0,
     "leftLeg": 0,
     "rightLeg": 0
    }
   },
   {
    "t": 0.75,
    "angles": {
     "root": 0,
     "spine": -0.03,
     "head": -0.01,
     "leftArm": -0.025,
     "rightArm": 0.025,
     "leftLeg": 0,
     "rightLeg": 0
    }
   },
   {
    "t": 1,
    "angles": {
     "root": 0,
     "spine": 0,
     "head": 0,
     "leftArm": 0,
     "rightArm": 0,
     "leftLeg": 0,
     "rightLeg": 0
    }
   }
  ]
 },
 "walk": {
  "durationMs": 720,
  "loop": true,
  "keyframes": [
   {
    "t": 0,
    "angles": {
     "root": 0,
     "spine": 0,
     "head": 0,
     "leftArm": 0,
     "rightArm": 0,
     "leftLeg": 0,
     "rightLeg": 0
    }
   },
   {
    "t": 0.25,
    "angles": {
     "root": 0,
     "spine": 0.03,
     "head": 0.01,
     "leftArm": -0.28,
     "rightArm": 0.28,
     "leftLeg": 0.32,
     "rightLeg": -0.32
    }
   },
   {
    "t": 0.5,
    "angles": {
     "root": 0,
     "spine": 0,
     "head": 0,
     "leftArm": 0,
     "rightArm": 0,
     "leftLeg": 0,
     "rightLeg": 0
    }
   },
   {
    "t": 0.75,
    "angles": {
     "root": 0,
     "spine": -0.03,
     "head": -0.01,
     "leftArm": 0.28,
     "rightArm": -0.28,
     "leftLeg": -0.32,
     "rightLeg": 0.32
    }
   },
   {
    "t": 1,
    "angles": {
     "root": 0,
     "spine": 0,
     "head": 0,
     "leftArm": 0,
     "rightArm": 0,
     "leftLeg": 0,
     "rightLeg": 0
    }
   }
  ]
 },
 "attack": {
  "durationMs": 560,
  "loop": true,
  "keyframes": [
   {
    "t": 0,
    "angles": {
     "root": 0,
     "spine": 0,
     "head": 0,
     "leftArm": 0,
     "rightArm": 0,
     "leftLeg": 0,
     "rightLeg": 0
    }
   },
   {
    "t": 0.2,
    "angles": {
     "root": 0,
     "spine": -0.12,
     "head": 0.02,
     "leftArm": 0.13,
     "rightArm": 0.42,
     "leftLeg": -0.06,
     "rightLeg": 0.06
    }
   },
   {
    "t": 0.5,
    "angles": {
     "root": 0,
     "spine": 0.22,
     "head": -0.04,
     "leftArm": -0.18,
     "rightArm": -0.61,
     "leftLeg": 0.04,
     "rightLeg": -0.04
    }
   },
   {
    "t": 0.75,
    "angles": {
     "root": 0,
     "spine": 0.08,
     "head": 0.02,
     "leftArm": 0.05,
     "rightArm": -0.18,
     "leftLeg": 0,
     "rightLeg": 0
    }
   },
   {
    "t": 1,
    "angles": {
     "root": 0,
     "spine": 0,
     "head": 0,
     "leftArm": 0,
     "rightArm": 0,
     "leftLeg": 0,
     "rightLeg": 0
    }
   }
  ]
 }
});
export function sampleAnimationClip(mode,timeMs=0){
 const clip=ANIMATION_CLIPS[mode];
 if(!clip||!Number.isFinite(timeMs))throw Error("Invalid authored animation request");
 const normalized=clip.loop?((timeMs%clip.durationMs)+clip.durationMs)%clip.durationMs:
  Math.max(0,Math.min(clip.durationMs,timeMs));
 const phase=normalized/clip.durationMs;
 const frames=clip.keyframes;
 let a=frames[0],b=frames[frames.length-1];
 for(let i=1;i<frames.length;i++){
  if(phase<=frames[i].t){a=frames[i-1];b=frames[i];break;}
 }
 const blend=b.t===a.t?0:(phase-a.t)/(b.t-a.t);
 const angles=Object.fromEntries(RIG_BONE_NAMES.map(name=>[
  name,a.angles[name]+(b.angles[name]-a.angles[name])*blend]));
 return {mode,phase,angles,durationMs:clip.durationMs};
}
