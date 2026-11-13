import test from "node:test";
import assert from "node:assert/strict";
import {MatchHost} from "../src/network.js";
import {createLoopbackProtocolServer} from "../src/loopbackProtocol.js";
test("group attack and Stop use atomic authenticated HTTP batches",async()=>{
 const host=new MatchHost([{id:"a",faction:"Humans"},{id:"b",faction:"Orcs"}],81);
 const token=host.credentialsFor("a").token;
 const own=host.match.players[0].units.filter(u=>u.alive&&u.attack>0).slice(0,2);
 assert.equal(own.length,2);
 const enemy=host.match.players[1].units.find(u=>u.alive);
 enemy.x=own[0].x+1;enemy.y=own[0].y;
 const {server}=createLoopbackProtocolServer(host);
 await new Promise(done=>server.listen(0,"127.0.0.1",done));
 const url="http://127.0.0.1:"+server.address().port+"/command-batch";
 async function batch(expectedVersion,orders){
  const r=await fetch(url,{method:"POST",headers:{"x-session-token":token,
   "Content-Type":"application/json"},body:JSON.stringify({expectedVersion,orders})});
  return {status:r.status,body:await r.json()};
 }
 try{
  const attack=own.map((u,i)=>({sequence:i+1,action:"attack",payload:{
   attacker:u.id,targetPlayer:"b",target:enemy.id}}));
  const invalid=structuredClone(attack);
  invalid[1].payload.attacker="not-owned";
  const rejected=await batch(0,invalid);
  assert.equal(rejected.status,400);
  assert.equal(host.version,0);
  assert.ok(own.every(u=>!host.match.orders[u.id]));
  const accepted=await batch(0,attack);
  assert.equal(accepted.status,200,JSON.stringify(accepted.body));
  assert.equal(accepted.body.commands,2);
  assert.ok(own.every(u=>host.match.orders[u.id]?.kind==="attack"));
  const stops=own.map((u,i)=>({sequence:i+3,action:"stop",payload:{unitId:u.id}}));
  const result=await batch(2,stops);
  assert.equal(result.status,200,JSON.stringify(result.body));
  assert.ok(own.every(u=>!host.match.orders[u.id]));
  assert.equal(host.version,4);
  const stale=await batch(0,stops);
  assert.equal(stale.status,400);
 }finally{server.closeAllConnections();await new Promise(done=>server.close(done));}
});
