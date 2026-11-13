import {mkdir,open,readFile,rename,unlink,stat} from "node:fs/promises";
import {dirname,resolve} from "node:path";
import {randomUUID} from "node:crypto";
import {MatchHost} from "./network.js";
import {assert} from "./util.js";

const MAX_CHECKPOINT_BYTES=50_000_000;
/** Local operator-only disk snapshots. NEVER mount or serve this directory. */
export async function writeHostCheckpoint(host,path){
 assert(host instanceof MatchHost,"Expected authoritative MatchHost");
 assert(typeof path==="string"&&path.length>0,"Checkpoint path required");
 const destination=resolve(path),folder=dirname(destination);
 const contents=host.checkpoint();
 assert(Buffer.byteLength(contents)<MAX_CHECKPOINT_BYTES,"Checkpoint exceeds disk limit");
 await mkdir(folder,{recursive:true,mode:0o700});
 const temp=destination+".tmp-"+process.pid+"-"+randomUUID();
 let handle;
 try{
  handle=await open(temp,"wx",0o600);
  await handle.writeFile(contents,"utf8");
  await handle.sync();
  await handle.close();handle=null;
  await rename(temp,destination);
 }catch(e){
  if(handle)await handle.close().catch(()=>{});
  await unlink(temp).catch(()=>{});
  throw e;
 }
 return {path:destination,bytes:Buffer.byteLength(contents),version:host.version};
}
export async function guardCheckpointStartup(path,{restore=false,reset=false}={}){
 assert(typeof restore==="boolean"&&typeof reset==="boolean","Invalid checkpoint startup mode");
 assert(!(restore&&reset),"Cannot restore and reset the same checkpoint");
 let exists=false;
 try{exists=(await stat(resolve(path))).isFile();}
 catch(e){if(e.code!=="ENOENT")throw e;}
 if(restore)assert(exists,"Requested checkpoint restore but file does not exist");
 if(!restore&&!reset)assert(!exists,
  "Existing checkpoint would be overwritten; use RESTORE_CHECKPOINT=1 or RESET_CHECKPOINT=1");
 return {exists,restore,reset};
}
export async function readHostCheckpoint(path){
 assert(typeof path==="string"&&path.length>0,"Checkpoint path required");
 const destination=resolve(path),details=await stat(destination);
 assert(details.isFile()&&details.size<MAX_CHECKPOINT_BYTES,
  "Checkpoint file missing or too large");
 const source=await readFile(destination,"utf8");
 return MatchHost.fromCheckpoint(source);
}
