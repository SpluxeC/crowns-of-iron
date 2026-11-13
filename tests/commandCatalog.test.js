import test from "node:test";
import assert from "node:assert/strict";
import {MatchHost} from "../src/network.js";
import {playerCommandCatalog} from "../src/commandCatalog.js";
import {createLoopbackProtocolServer} from "../src/loopbackProtocol.js";

test("catalog exposes real server buildings, all eligible production roles and tech state",()=>{
 const host=new MatchHost([{id:"a",faction:"Humans"},{id:"b",faction:"Orcs"}],19);
 const first=playerCommandCatalog(host.match,"a"),p=host.match.players[0];
 assert.equal(first.revision,"shared-prototype");
 assert.ok(first.buildings.some(b=>b.kind==="Training Camp"&&b.ageUnlocked));
 assert.ok(first.buildings.some(b=>b.kind==="Barracks"&&!b.ageUnlocked));
 assert.ok(first.training.some(t=>t.role==="Worker"&&t.facility==="Town Center"));
 assert.ok(first.training.some(t=>t.role==="Scout"&&t.facility==="Town Center"));
 assert.equal(first.research.find(t=>t.id==="CIV-01").available,true);
 assert.equal(first.research.find(t=>t.id==="CIV-02").available,false);
 const a=host.credentialsFor("a").token;
 host.submit({token:a,sequence:1,action:"research",
  payload:{facility:"Town Center",id:"CIV-01"}});
 const after=playerCommandCatalog(host.match,"a");
 assert.equal(after.research.find(t=>t.id==="CIV-01").queued,true);
 assert.equal(after.research.find(t=>t.id==="CIV-01").available,false);
 assert.ok(after.research.find(t=>t.id==="CIV-02").missing.includes("CIV-01"));
 assert.ok(after.buildings.every(b=>b.cost&&b.footprint.length===2));
 assert.equal(Object.keys(after).includes("resources"),false);
});
test("catalog endpoint token-scoped; no enemy economy or credentials",async()=>{
 const host=new MatchHost([{id:"a",faction:"Humans"},{id:"b",faction:"Orcs"}],11);
 const token=host.credentialsFor("a").token,other=host.credentialsFor("b").token;
 const {server}=createLoopbackProtocolServer(host);
 await new Promise(resolve=>server.listen(0,"127.0.0.1",resolve));
 try{
  const uri="http://127.0.0.1:"+server.address().port+"/catalog";
  const fail=await fetch(uri);assert.equal(fail.status,401);
  const res=await fetch(uri,{headers:{"x-session-token":token}});
  assert.equal(res.status,200);
  const data=await res.json();
  assert.equal(data.playerId,"a");
  assert.equal(data.faction,"Humans");
  assert.equal(JSON.stringify(data).includes(token),false);
  assert.equal(JSON.stringify(data).includes(other),false);
  assert.equal(JSON.stringify(data).includes("units"),false);
 }finally{server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
});
