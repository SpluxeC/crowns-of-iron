import test from "node:test";
import assert from "node:assert/strict";
import {MatchHost} from "../src/network.js";
import {createLoopbackProtocolServer} from "../src/loopbackProtocol.js";
const people=[{id:"human",faction:"Humans"},{id:"orc",faction:"Orcs"}];
test("local browser commands construct buildings, research and recruit on server",async()=>{
 const host=new MatchHost(people,57),token=host.credentialsFor("human").token;
 const map=host.match.battlefield;
 for(const t of map.tiles){t.terrain="grass";t.occupied=null;t.resource=null;}
 const {server}=createLoopbackProtocolServer(host);
 await new Promise(resolve=>server.listen(0,"127.0.0.1",resolve));
 const base="http://127.0.0.1:"+server.address().port;
 let seq=1;
 async function action(action,payload){
  const res=await fetch(base+"/command",{method:"POST",
   headers:{"x-session-token":token,"Content-Type":"application/json"},
   body:JSON.stringify({sequence:seq++,action,payload})});
  const data=await res.json();
  assert.equal(res.status,200,JSON.stringify(data));
  return data;
 }
 try{
  for(const name of ["/clientRules.js","/streamProtocol.js"]){
   const response=await fetch(base+name);
   assert.equal(response.status,200);
   assert.match(response.headers.get("content-type"),/text\/javascript/);
  }
  const home=map.starts[0],worker=host.match.players[0].units.find(u=>u.archetype==="Worker");
  const site=await action("build",{kind:"Training Camp",x:home.x+4,y:home.y+4,
   workers:[worker.id]});
  assert.ok(site.result);
  host.advance(45000);
  const own=host.match.players[0],camp=host.match.constructions[site.result];
  assert.ok(camp.completed);
  const train=await action("train",{facility:camp.facilityKey,role:"Club Fighter"});
  assert.equal(train.accepted,true);
  const research=await action("research",{facility:"Town Center",id:"CIV-01"});
  assert.equal(research.accepted,true);
  const state=await fetch(base+"/state",{headers:{"x-session-token":token}});
  const snapshot=await state.json();
  assert.equal(snapshot.nextSequence,4);
  assert.equal(snapshot.state.players[0].unitQueues[camp.facilityKey].length,1);
  assert.equal(snapshot.state.players[0].researchQueues["Town Center"].length,1);
  assert.equal(snapshot.state.constructions[site.result].completed,true);
  const enemy=await fetch(base+"/state",{
   headers:{"x-session-token":host.credentialsFor("orc").token}});
  const enemyView=await enemy.json();
  assert.equal(enemyView.state.players[0].resources,undefined);
 }finally{
  server.closeAllConnections();
  await new Promise(resolve=>server.close(resolve));
 }
});
