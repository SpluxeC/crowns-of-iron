import test from "node:test";
import assert from "node:assert/strict";
import {MatchHost} from "../src/network.js";
const players=[{id:"alice",faction:"Humans"},{id:"bob",faction:"Ursa"}];
test("local match protocol rejects spoofing, duplicate packets and debug commands",()=>{
 const host=new MatchHost(players,42);
 const a=host.credentialsFor("alice");
 assert.throws(()=>host.view("not-a-real-token"),/Unauthorized/);
 assert.throws(()=>host.submit({token:a.token,sequence:1,action:"income",payload:{amount:{Gold:9999}}}),/forbidden/);
 assert.throws(()=>host.submit({token:a.token,sequence:1,action:"train",payload:{player:"bob",facility:"Town Center",role:"Worker"}}),/Spoofed/);
 const r=host.submit({token:a.token,sequence:1,action:"train",payload:{facility:"Town Center",role:"Worker"}});
 assert.equal(r.accepted,true);
 assert.throws(()=>host.submit({token:a.token,sequence:1,action:"train",payload:{facility:"Town Center",role:"Worker"}}),/duplicate/);
 assert.equal(host.view(a.token).state.players[0].popUsed,4);
 host.advance(15000);assert.equal(host.view(a.token).state.players[0].popUsed,5);
});
test("sessions are per player and cannot issue other players' orders",()=>{
 const host=new MatchHost(players),a=host.credentialsFor("alice"),b=host.credentialsFor("bob");
 assert.notEqual(a.token,b.token);
 assert.equal(host.view(b.token).playerId,"bob");
 const r=host.submit({token:b.token,sequence:1,action:"train",payload:{facility:"Town Center",role:"Worker"}});
 assert.equal(r.accepted,true);
});

test("remote combat queues spatial orders and cannot instantly damage across the map",()=>{
 const host=new MatchHost(players),a=host.credentialsFor("alice");
 const own=host.match.players[0].units[1],enemy=host.match.players[1].units[0];
 const before=enemy.hp;
 const receipt=host.submit({token:a.token,sequence:1,action:"attack",payload:{
   attacker:own.id,targetPlayer:"bob",target:enemy.id
 }});
 assert.equal(receipt.accepted,true);
 assert.equal(enemy.hp,before);
 assert.equal(host.match.orders[own.id].kind,"attack");
});
test("unvalidated remote healing and direct resource injection are rejected",()=>{
 const host=new MatchHost(players),a=host.credentialsFor("alice");
 for(const action of ["heal","repair","income","facility","popCap"])
   assert.throws(()=>host.submit({token:a.token,sequence:1,action,payload:{}}),/forbidden/);
});
