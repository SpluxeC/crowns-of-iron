import test from "node:test";
import assert from "node:assert/strict";
import {MatchHost} from "../src/network.js";
import {createLoopbackProtocolServer} from "../src/loopbackProtocol.js";
test("server-authoritative stop releases only owned orders and is replay-safe",async()=>{
 const host=new MatchHost([{id:"a",faction:"Humans"},{id:"b",faction:"Orcs"}],91);
 const a=host.credentialsFor("a").token,b=host.credentialsFor("b").token;
 const own=host.match.players[0].units[0],enemy=host.match.players[1].units[0];
 host.match.orders[own.id]={kind:"move",path:[{x:2,y:2}],carryMs:0};
 host.match.orders[enemy.id]={kind:"move",path:[{x:4,y:4}],carryMs:0};
 const {server}=createLoopbackProtocolServer(host);
 await new Promise(done=>server.listen(0,"127.0.0.1",done));
 const url="http://127.0.0.1:"+server.address().port+"/command";
 async function send(token,sequence,unitId){
  const r=await fetch(url,{method:"POST",headers:{"x-session-token":token,
   "Content-Type":"application/json"},body:JSON.stringify({
   sequence,action:"stop",payload:{unitId}})});
  return {status:r.status,body:await r.json()};
 }
 try{
  assert.equal((await send(a,1,enemy.id)).status,400);
  assert.ok(host.match.orders[enemy.id]);
  const reply=await send(a,1,own.id);
  assert.equal(reply.status,200);
  assert.equal(reply.body.result.stopped,true);
  assert.equal(host.match.orders[own.id],undefined);
  assert.ok(host.match.orders[enemy.id]);
  const duplicate=await send(a,1,own.id);
  assert.equal(duplicate.status,400);
  const second=await send(a,2,own.id);
  assert.equal(second.body.result.stopped,false);
  assert.equal((await send(b,1,enemy.id)).status,200);
 }finally{server.closeAllConnections();await new Promise(done=>server.close(done));}
});
