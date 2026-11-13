import test from "node:test";
import assert from "node:assert/strict";
import {MatchHost} from "../src/network.js";
const players=[{id:"a",faction:"Humans"},{id:"b",faction:"Orcs"}];
test("atomic batch commits consecutive authenticated commands at one matching version",()=>{
 const host=new MatchHost(players,91),token=host.credentialsFor("a").token;
 const result=host.submitBatch({token,expectedVersion:0,orders:[
  {sequence:1,action:"allocate",payload:{workers:{Food:2,Wood:1}}},
  {sequence:2,action:"train",payload:{facility:"Town Center",role:"Worker"}}
 ]});
 assert.equal(result.accepted,true);assert.equal(result.commands,2);
 assert.equal(result.version,2);
 assert.equal(host.match.players[0].unitQueues["Town Center"].length,1);
 assert.throws(()=>host.submitBatch({token,expectedVersion:0,orders:[
  {sequence:3,action:"allocate",payload:{workers:{Food:3}}}
 ]}),/stale/);
});
test("failed second action rolls back resources, queues, sequencing and event log",()=>{
 const host=new MatchHost(players,21),token=host.credentialsFor("a").token;
 const before=structuredClone(host.match.players[0].resources);
 assert.throws(()=>host.submitBatch({token,expectedVersion:0,orders:[
  {sequence:1,action:"train",payload:{facility:"Town Center",role:"Worker"}},
  {sequence:2,action:"income",payload:{amount:{Gold:999999}}}
 ]}),/forbidden/);
 assert.deepEqual(host.match.players[0].resources,before);
 assert.equal(host.match.players[0].unitQueues["Town Center"].length,0);
 assert.equal(host.version,0);assert.equal(host.events.length,0);
 assert.equal(host.submit({token,sequence:1,action:"allocate",
  payload:{workers:{Food:3}}}).accepted,true);
});
test("per-tick command budget rejects spam and resets after authoritative advance",()=>{
 const host=new MatchHost(players,12),token=host.credentialsFor("a").token;
 host.maxCommandsPerVersion=3;
 for(let i=1;i<=3;i++)host.submit({token,sequence:i,action:"allocate",
   payload:{workers:{Food:3}}});
 assert.throws(()=>host.submit({token,sequence:4,action:"allocate",
   payload:{workers:{Food:3}}}),/budget/);
 host.advance(1000);
 assert.equal(host.submit({token,sequence:4,action:"allocate",
  payload:{workers:{Wood:3}}}).accepted,true);
});
test("fogged opposing structures never disclose secret garrison identifiers or upgrade queues",()=>{
 const host=new MatchHost(players,20),token=host.credentialsFor("a").token;
 const loc={id:"visibleSite",owner:"b",kind:"Watchtower",x:10,y:10,width:2,height:2};
 host.match.battlefield.structures.push(loc);
 host.match.constructions={visibleSite:{siteId:"visibleSite",owner:"b",kind:"Watchtower",
  completed:true,garrisonIds:["hidden-defender"],upgradeQueue:[{name:"Secret Upgrade"}],
  workerIds:["worker-secret"]}};
 host.match.players[0].units[0].x=10;host.match.players[0].units[0].y=9;
 const view=host.view(token);
 assert.ok(view.state.constructions.visibleSite);
 assert.equal(view.state.constructions.visibleSite.garrisonIds,undefined);
 assert.equal(view.state.constructions.visibleSite.upgradeQueue,undefined);
});
