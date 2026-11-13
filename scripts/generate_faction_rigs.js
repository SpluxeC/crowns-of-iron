import {writeFile} from "node:fs/promises";
import {RIG_BONE_NAMES,RIG_PROFILES} from "../web/rigProfiles.js";
const doc={schema:1,coordinateSystem:"Y-up, Z-forward",
 rigType:"runtime procedural body-region pivots (not exportable skinned armature)",
 bones:RIG_BONE_NAMES,clips:["idle","walk","attack"],factions:RIG_PROFILES};
await writeFile(new URL("../assets/rigs/faction-rigs.json",import.meta.url),
 JSON.stringify(doc,null,2)+"\n");
console.log("Updated six procedural faction rig profiles.");
