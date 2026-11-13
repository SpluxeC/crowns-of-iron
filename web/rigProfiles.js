import {factionSlug} from "./factionArt.js";
/** Approximate body-region rig, with faction-specific joint pivots and clip ranges.
 * No imported armature, bone weights, inverse bind matrices or rigged FBX/glTF. */
export const RIG_BONE_NAMES=Object.freeze(["root","spine","head","leftArm",
 "rightArm","leftLeg","rightLeg"]);
export const RIG_PROFILES=Object.freeze({
 "humans": {
  "shoulderWidth": 0.3,
  "hipWidth": 0.16,
  "shoulderY": 0.66,
  "hipY": 0.3,
  "headY": 0.81,
  "armSwing": 0.24,
  "legSwing": 0.22,
  "attackSwing": 0.31
 },
 "orcs": {
  "shoulderWidth": 0.43,
  "hipWidth": 0.23,
  "shoulderY": 0.63,
  "hipY": 0.3,
  "headY": 0.78,
  "armSwing": 0.28,
  "legSwing": 0.2,
  "attackSwing": 0.38
 },
 "dwarfs": {
  "shoulderWidth": 0.39,
  "hipWidth": 0.22,
  "shoulderY": 0.62,
  "hipY": 0.31,
  "headY": 0.79,
  "armSwing": 0.2,
  "legSwing": 0.16,
  "attackSwing": 0.32
 },
 "tree-elves": {
  "shoulderWidth": 0.27,
  "hipWidth": 0.16,
  "shoulderY": 0.69,
  "hipY": 0.34,
  "headY": 0.83,
  "armSwing": 0.29,
  "legSwing": 0.28,
  "attackSwing": 0.26
 },
 "corrupt-elves": {
  "shoulderWidth": 0.28,
  "hipWidth": 0.16,
  "shoulderY": 0.69,
  "hipY": 0.33,
  "headY": 0.83,
  "armSwing": 0.24,
  "legSwing": 0.26,
  "attackSwing": 0.4
 },
 "ursa": {
  "shoulderWidth": 0.49,
  "hipWidth": 0.3,
  "shoulderY": 0.61,
  "hipY": 0.29,
  "headY": 0.77,
  "armSwing": 0.18,
  "legSwing": 0.16,
  "attackSwing": 0.34
 }
});
export function rigForFaction(name){
 const slug=factionSlug(name);
 return slug?RIG_PROFILES[slug]??null:null;
}
export function boneForPosition(x,y,height=1.5,rig=RIG_PROFILES.humans){
 const t=y/Math.max(.1,height),w=Math.abs(x);
 if(t<rig.hipY&&w>.055)return x<0?"leftLeg":"rightLeg";
 if(t>rig.shoulderY&&w<rig.shoulderWidth*.66)return t>rig.headY?"head":"spine";
 if(t>=rig.hipY&&t<rig.headY&&w>rig.shoulderWidth)
  return x<0?"leftArm":"rightArm";
 return "spine";
}
export function rotateAroundJointX(y,z,pivotY,angle){
 const cos=Math.cos(angle),sin=Math.sin(angle);
 return [pivotY+(y-pivotY)*cos-z*sin,(y-pivotY)*sin+z*cos];
}
