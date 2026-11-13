import test from "node:test";
import assert from "node:assert/strict";
import {MatchHost} from "../src/network.js";
import {checksum} from "../src/simulation.js";
const people=[{id:"alpha",faction:"Humans"},{id:"beta",faction:"Orcs"}];
test("opt-in lobby prevents commands and ticks until all players ready and host launches",()=>{
 const h=new MatchHost(people,77,{requireReady:true});
 const a=h.credentialsFor("alpha").token,b=h.credentialsFor("beta").token;
 assert.equal(h.lobbyState(a).started,false);
 assert.throws(()=>h.advance(1000),/not started/);
 assert.throws(()=>h.submit({token:a,sequence:1,action:"allocate",
  payload:{workers:{Food:3}}}),/not started/);
 assert.throws(()=>h.setReady("unauthorized",true),/Unauthorized/);
 h.setReady(a,true);
 assert.throws(()=>h.startMatch(a),/All players must be ready/);
 h.setReady(b,true);
 assert.throws(()=>h.startMatch(b),/Only lobby host/);
 assert.equal(h.startMatch(a).started,true);
 assert.throws(()=>h.setReady(a,false),/not accepting/);
 assert.equal(h.submit({token:a,sequence:1,action:"allocate",
  payload:{workers:{Food:3}}}).accepted,true);
 h.advance(1000);
 assert.ok(h.version>0);
});
test("checkpoint round trip keeps state/versions but rotates all session tokens",()=>{
 const h=new MatchHost(people,88),a=h.credentialsFor("alpha").token,b=h.credentialsFor("beta").token;
 h.submit({token:a,sequence:1,action:"allocate",payload:{workers:{Wood:3}}});
 h.advance(1000);
 const encoded=h.checkpoint(),restored=MatchHost.fromCheckpoint(encoded);
 assert.equal(checksum(restored.match),checksum(h.match));
 assert.equal(restored.version,h.version);
 assert.equal(restored.sequence,h.sequence);
 const newA=restored.credentialsFor("alpha").token;
 assert.notEqual(newA,a);
 assert.notEqual(restored.credentialsFor("beta").token,b);
 assert.throws(()=>restored.view(a),/Unauthorized/);
 assert.throws(()=>restored.submit({token:newA,sequence:1,action:"allocate",
  payload:{workers:{Food:3}}}),/Out-of-order/);
 assert.equal(restored.submit({token:newA,sequence:2,action:"allocate",
  payload:{workers:{Food:3}}}).accepted,true);
});
test("checkpoint rejects corrupted data and restores pre-launch readiness",()=>{
 const h=new MatchHost(people,9,{requireReady:true}),token=h.credentialsFor("alpha").token;
 h.setReady(token,true);
 const raw=h.checkpoint();
 const bad=JSON.parse(raw);
 bad.payload.version=99;
 assert.throws(()=>MatchHost.fromCheckpoint(JSON.stringify(bad)),/integrity/);
 const restored=MatchHost.fromCheckpoint(raw),next=restored.credentialsFor("alpha").token;
 assert.equal(restored.lobbyState(next).players[0].ready,true);
 assert.equal(restored.lobbyState(next).started,false);
});
