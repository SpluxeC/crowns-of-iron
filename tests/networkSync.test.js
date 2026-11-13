import test from "node:test";
import assert from "node:assert/strict";
import {MatchHost} from "../src/network.js";

const players=[{id:"a",faction:"Humans"},{id:"b",faction:"Orcs"}];
test("local authoritative snapshot advances monotonically and keeps fog filtering",()=>{
 const host=new MatchHost(players,33),token=host.credentialsFor("a").token;
 const initial=host.resync({token,afterVersion:0});
 assert.equal(initial.version,0);
 assert.equal(initial.events.length,0);
 host.advance(1000);
 const snapshot=host.resync({token,afterVersion:0});
 assert.equal(snapshot.version,1);
 const enemy=snapshot.state.players.find(p=>p.id==="b");
 assert.equal(enemy.resources,undefined);
 assert.equal(enemy.researchQueues,undefined);
 assert.equal(enemy.units.length,0);
 assert.throws(()=>host.resync({token,afterVersion:100}),/Invalid client state version/);
});
test("session-token rotation revokes old credential without resetting command sequencing",()=>{
 const host=new MatchHost(players,21),token=host.credentialsFor("a").token;
 const order=host.submit({token,sequence:1,action:"allocate",payload:{
   workers:{Food:2,Wood:1}
 }});
 assert.equal(order.accepted,true);
 const rotated=host.rotateToken(token);
 assert.notEqual(rotated.token,token);
 assert.throws(()=>host.resync({token,afterVersion:0}),/Unauthorized/);
 assert.throws(()=>host.submit({token:rotated.token,sequence:1,action:"allocate",payload:{
   workers:{Food:3}
 }}),/duplicate|Out-of-order/);
 assert.equal(host.submit({token:rotated.token,sequence:2,action:"allocate",payload:{
   workers:{Food:3}
 }}).accepted,true);
 const latest=host.resync({token:rotated.token,afterVersion:0});
 assert.equal(latest.events.length,2);
 assert.deepEqual(latest.events.map(e=>e.action),["allocate","allocate"]);
});
test("resync excludes other players' command metadata and credentials",()=>{
 const host=new MatchHost(players),a=host.credentialsFor("a").token,b=host.credentialsFor("b").token;
 host.submit({token:a,sequence:1,action:"allocate",payload:{workers:{Food:3}}});
 host.submit({token:b,sequence:1,action:"allocate",payload:{workers:{Wood:3}}});
 const view=host.resync({token:a,afterVersion:0});
 assert.deepEqual(view.events.map(e=>e.player),["a"]);
 assert.equal(JSON.stringify(view).includes(b),false);
 assert.equal(JSON.stringify(view).includes(a),false);
});
