import {rosterMeshPath,rosterMeshKey} from "./rosterArt.js";
import {parseObj,parseMtl} from "./objLoader.js";
/** Bounded on-demand roster OBJ loading. Never fetch all 216 meshes on client boot. */
export function createRosterMeshLoader(fetcher=fetch,{batchLimit=12}={}){
 if(!Number.isInteger(batchLimit)||batchLimit<1||batchLimit>36)
  throw Error("Invalid roster batch limit");
 const cache=new Map(),pending=new Map(),failures=new Map();
 let palettePromise=null;
 function palette(){
  if(!palettePromise)palettePromise=(async()=>{
   const response=await fetcher("/assets/models/crowns-palette.mtl");
   if(!response.ok)throw Error("Roster materials unavailable");
   return parseMtl(await response.text());
  })().catch(error=>{palettePromise=null;throw error;});
  return palettePromise;
 }
 async function loadOne(faction,role){
  const key=rosterMeshKey(faction,role);
  if(!key)throw Error("Invalid roster art identity");
  if(cache.has(key))return cache.get(key);
  if(pending.has(key))return pending.get(key);
  const task=(async()=>{
   const [materials,response]=await Promise.all([
    palette(),fetcher(rosterMeshPath(faction,role))]);
   if(!response.ok)throw Error("Roster OBJ unavailable: "+key);
   const model=parseObj(await response.text(),materials);
   cache.set(key,model);failures.delete(key);return model;
  })().catch(error=>{failures.set(key,error.message);throw error;})
    .finally(()=>pending.delete(key));
  pending.set(key,task);return task;
 }
 async function loadBatch(requests){
  if(!Array.isArray(requests)||requests.length>batchLimit)throw Error("Roster load batch too large");
  const keys=new Set();
  for(const req of requests){
   const key=rosterMeshKey(req.faction,req.role);
   if(!key)throw Error("Invalid roster mesh batch member");
   keys.add(key);
  }
  const unique=[...keys].map(key=>({faction:key.split("/")[0],
   role:requests.find(r=>rosterMeshKey(r.faction,r.role)===key).role}));
  const results=await Promise.allSettled(unique.map(x=>loadOne(x.faction,x.role)));
  return {loaded:results.filter(r=>r.status==="fulfilled").length,
   failed:results.filter(r=>r.status==="rejected").length,requested:unique.length};
 }
 return {
  loadOne,loadBatch,
  get(faction,role){return cache.get(rosterMeshKey(faction,role))??null;},
  keys(){return [...cache.keys()];},
  errors(){return Object.fromEntries(failures);},
  stats(){return {loaded:cache.size,pending:pending.size,errors:failures.size};}
 };
}
