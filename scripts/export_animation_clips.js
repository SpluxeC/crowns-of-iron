import {writeFile} from "node:fs/promises";
import {ANIMATION_CLIPS} from "../web/animationClips.js";
import {RIG_BONE_NAMES} from "../web/rigProfiles.js";
const value={schema:1,coordinateSystem:"Y-up",units:"joint X-axis radians",
 mode:"reusable procedural seven-joint animation curves (not glTF skin)",
 bones:RIG_BONE_NAMES,clips:ANIMATION_CLIPS};
await writeFile(new URL("../assets/animations/rig-clips.json",import.meta.url),
 JSON.stringify(value,null,2)+"\n");
console.log("Exported 3 authored keyframe animation clips.");
