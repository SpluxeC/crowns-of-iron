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
