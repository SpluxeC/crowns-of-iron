import test from "node:test";
import assert from "node:assert/strict";
import {createMatch,step} from "../src/simulation.js";
import {configureMode,setHillPresence,addMonument,removeMonument,addTimedPoints} from "../src/modes.js";
const players=[{id:"a",faction:"Humans",team:"blue"},{id:"b",faction:"Orcs",team:"red"}];
test("hill requires 10 minutes uncontested control, pauses when contested",()=>{
 const m=createMatch(players);
 configureMode(m,"KingOfHill",{hillHoldMs:600000});
 setHillPresence(m,["a"]);for(let i=0;i<5;i++)step(m,60000);
 assert.equal(m.modeState.hillScore.blue,300000);
 setHillPresence(m,["a","b"]);for(let i=0;i<3;i++)step(m,60000);
 assert.equal(m.modeState.hillScore.blue,300000);
 setHillPresence(m,["a"]);for(let i=0;i<5;i++)step(m,60000);
 assert.equal(m.winner,"blue");
});
test("same-team presence does not contest a hill",()=>{
 const m=createMatch([...players,{id:"c",faction:"Ursa",team:"blue"}]);
 configureMode(m,"KingOfHill",{hillHoldMs:10000});
 setHillPresence(m,["a","c"]);step(m,10000);
 assert.equal(m.winner,"blue");
});
test("monument requires Age V and 15-minute surviving hold",()=>{
 const m=createMatch(players);configureMode(m,"GreatMonument");
 assert.throws(()=>addMonument(m,"a"),/Age V/);
 m.players[0].age="V";addMonument(m,"a");
 for(let i=0;i<15;i++)step(m,60000);
 assert.equal(m.winner,"blue");
});
test("destroyed monument loses all accumulated hold progress",()=>{
 const m=createMatch(players);configureMode(m,"GreatMonument",{monumentHoldMs:120000});
 m.players[0].age="V";addMonument(m,"a");step(m,60000);
 removeMonument(m,"a");addMonument(m,"a");
 step(m,60000);assert.equal(m.winner,null);
 step(m,60000);assert.equal(m.winner,"blue");
});
test("timed score determines winner and a tie is a draw",()=>{
 const m=createMatch(players);configureMode(m,"TimedScore",{durationMs:120000});
 addTimedPoints(m,"a",100);addTimedPoints(m,"b",80);
 step(m,60000);assert.equal(m.winner,null);
 step(m,60000);assert.equal(m.winner,"blue");
 const tied=createMatch(players);configureMode(tied,"TimedScore",{durationMs:10000});
 addTimedPoints(tied,"a",10);addTimedPoints(tied,"b",10);
 step(tied,10000);assert.equal(tied.winner,"draw");
});
test("locked victory team stays unchanged by scoring",()=>{
 const m=createMatch(players);configureMode(m,"TimedScore",{durationMs:10000});
 addTimedPoints(m,"a",1000);
 step(m,10000);assert.equal(m.winner,"blue");
 assert.deepEqual(m.players.map(x=>x.team),["blue","red"]);
});
