import {MatchHost} from "../src/network.js";
import {enableUnitCollision} from "../src/unitCollision.js";
import {createLoopbackProtocolServer} from "../src/loopbackProtocol.js";
import {guardCheckpointStartup,readHostCheckpoint,writeHostCheckpoint} from "../src/hostStore.js";

// Loopback-only developer server; checkpoint files are never exposed as HTTP.
const file=process.env.CHECKPOINT_FILE||".local/crowns-host-checkpoint.json";
const restoring=process.env.RESTORE_CHECKPOINT==="1";
const reset=process.env.RESET_CHECKPOINT==="1";
await guardCheckpointStartup(file,{restore:restoring,reset});
const host=restoring?await readHostCheckpoint(file):
 new MatchHost([{id:"human",faction:"Humans"},{id:"orc",faction:"Orcs"}],2026,
  {requireReady:process.env.REQUIRE_READY==="1"});
if(!restoring)enableUnitCollision(host.match);
const {server,publish}=createLoopbackProtocolServer(host);
const port=Number(process.env.PORT||5190);
let timer=null,checkpointTimer=null,pending=Promise.resolve(),closed=false,lastStored=-1;
function persist(){
 // Serialized writes prevent old snapshots overwriting newer ones.
 pending=pending.catch(()=>{}).then(async()=>{
  if(host.version===lastStored)return;
  const result=await writeHostCheckpoint(host,file);
  lastStored=result.version;
 });
 pending.catch(error=>console.error("Checkpoint write failed:",error.message));
 return pending;
}
timer=setInterval(()=>{
 if(host.lobby.started){host.advance(1000);publish();}
},1000);
checkpointTimer=setInterval(()=>{persist();},5000);
async function shutdown(){
 if(closed)return;closed=true;
 clearInterval(timer);clearInterval(checkpointTimer);
 try{await persist();}catch(e){console.error("Final checkpoint failed:",e.message);}
 server.closeAllConnections();
 server.close();
}
process.on("SIGINT",()=>{shutdown().then(()=>process.exit(0));});
process.on("SIGTERM",()=>{shutdown().then(()=>process.exit(0));});
server.listen(port,"127.0.0.1",()=>{
 console.log("Crowns of Iron local multiplayer browser: http://127.0.0.1:"+port+"/client");
 console.log("Local checkpoint: "+file+(restoring?" (restored)":" (new match)"));
 console.log("DEV ONLY: distribute each session token privately. Tokens change on restore.");
 for(const p of host.match.players)console.log(p.id+": "+host.credentialsFor(p.id).token);
 console.log("Set RESTORE_CHECKPOINT=1 to resume, RESET_CHECKPOINT=1 to discard an old save, REQUIRE_READY=1 for a new ready lobby.");
 console.log("No public TLS, accounts, matchmaking, or crash-proof server persistence.");
});
