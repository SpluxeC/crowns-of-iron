import {MatchHost} from "./network.js";
import {createLoopbackProtocolServer} from "./loopbackProtocol.js";
import {percentile} from "../web/perfTelemetry.js";
import {assert} from "./util.js";
const FACTIONS=["Humans","Orcs","Dwarfs","Tree Elves","Corrupt Elves","Ursa",
 "Humans","Orcs"];
/** Authenticated, actual local HTTP request benchmark. NOT a WAN/TLS load test. */
export async function runLocalHttpBenchmark({players=8,rounds=12,seed=707}={}){
 assert(Number.isSafeInteger(players)&&players>=2&&players<=8,"Invalid benchmark player count");
 assert(Number.isSafeInteger(rounds)&&rounds>=1&&rounds<=100,
  "Invalid benchmark rounds");
 const host=new MatchHost(FACTIONS.slice(0,players).map((f,i)=>({
  id:"p"+i,faction:f})),seed);
 const transport=createLoopbackProtocolServer(host);
 await new Promise((resolve,reject)=>{
  transport.server.once("error",reject);
  transport.server.listen(0,"127.0.0.1",resolve);
 });
 const base="http://127.0.0.1:"+transport.server.address().port;
 const tokens=host.match.players.map(p=>host.credentialsFor(p.id).token);
 const samples=[],sizes=[];
 let authenticated=0,privacyChecks=0;
 try{
  const unauthorized=await fetch(base+"/state");
  assert(unauthorized.status===401,"Missing session did not fail");
  for(let round=0;round<rounds;round++){
   const batch=await Promise.all(tokens.map(async(token,index)=>{
    const begin=performance.now();
    const response=await fetch(base+"/state",{
     headers:{"x-session-token":token}});
    const raw=await response.text();
    const elapsed=performance.now()-begin;
    assert(response.status===200,"Authenticated snapshot failed");
    const body=JSON.parse(raw);
    assert(body.playerId==="p"+index,"Session owner mismatch");
    assert(body.state.players[index].resources,
     "Requesting player must see own resources");
    assert(body.state.players.every((p,j)=>j===index||p.resources===undefined),
     "Opponent private economy leaked");
    assert(!raw.includes(token),"Session token leaked in snapshot");
    return {elapsed,bytes:Buffer.byteLength(raw)};
   }));
   for(const value of batch){samples.push(value.elapsed);sizes.push(value.bytes);
    authenticated++;privacyChecks++;}
  }
  return {transport:"real-loopback-http",players,rounds,
   successfulRequests:authenticated,privateEconomyChecks:privacyChecks,
   responseMs:{p50:percentile(samples,.50),p95:percentile(samples,.95),
    max:Math.max(...samples)},
   responseBytes:{p50:percentile(sizes,.5),p95:percentile(sizes,.95),
    max:Math.max(...sizes)},unauthorizedRejected:true,
   limitations:"localhost HTTP only, no TLS, WAN, browser GPU, sustained load, or production authentication"};
 }finally{
  transport.server.closeAllConnections();
  await new Promise(resolve=>transport.server.close(resolve));
 }
}
