import {readFile} from "node:fs/promises";
import {loadFactionObjSet} from "../web/objLoader.js";
import {loadFactionTextures} from "../web/factionTextures.js";
import {FACTION_SLUGS} from "../web/factionArt.js";
import {rigForFaction} from "../web/rigProfiles.js";
import {poseAt,deformVertex} from "../web/meshAnimation.js";
import {runBrowserDeliverySmoke} from "../src/browserDeliverySmoke.js";
import {assert} from "../src/util.js";
const fetcher=async path=>{
 const file=new URL("../"+path.slice(1),import.meta.url);
 try{const txt=await readFile(file,"utf8");return {ok:true,text:async()=>txt};}
 catch{return {ok:false};}
};
const [models,textures]=await Promise.all([loadFactionObjSet(fetcher),
 loadFactionTextures(fetcher)]);
assert(Object.keys(models).length===60);
assert(Object.keys(textures).length===6);
for(const slug of FACTION_SLUGS){
 const rig=rigForFaction(slug),mesh=models[slug+"/infantry"];
 assert(rig&&mesh&&mesh.triangles>130);
 const before=deformVertex(.35,.4,.1,poseAt("idle",0),1.5,rig);
 const after=deformVertex(.35,.4,.1,poseAt("walk",300),1.5,rig);
 assert(JSON.stringify(before)!==JSON.stringify(after));
}
const http=await runBrowserDeliverySmoke();
assert(http.factionMeshes===60&&http.factionTextures===6&&
 http.factionRigProfiles===6);
console.log(JSON.stringify({milestones:"7.9–8.2",factions:6,
 uniqueWavefrontObjs:Object.keys(models).length,
 surfacePatternMaps:Object.keys(textures).length,
 proceduralRigProfiles:6,clips:["idle","walk","attack"],
 httpAssetRoutes:60,validatedHttp: http.authenticatedBatch,
 limitations:"No UV/PBR per-pixel textures, exportable skeletal rigs, 216 unit-unique assets or real GPU browser visual QA"},null,2));
