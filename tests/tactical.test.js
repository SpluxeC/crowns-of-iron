import test from "node:test";
import assert from "node:assert/strict";
import {createMatch,command,step} from "../src/simulation.js";
import {makeMap,findPath,walkable} from "../src/map.js";
import {attachBattlefield,issueAttack} from "../src/battlefield.js";
import {enableBot} from "../src/ai.js";
const participants=[{id:"a",faction:"Humans"},{id:"b",faction:"Orcs"}];
test("battlefield attach and movement are deterministic, reachable and bounded",()=>{
 const m=createMatch(participants,27),map=makeMap({seed:27,players:2});
 attachBattlefield(m,map);
 const u=m.players[0].units[0],old={x:u.x,y:u.y};
 const dest={x:Math.floor(map.width/2),y:Math.floor(map.height/2)};
 assert.ok(findPath(map,old,dest));
 const count=command(m,{player:"a",action:"move",unitId:u.id,...dest});
 assert.ok(count>0);
 step(m,2000);
 assert.ok(u.x!==old.x||u.y!==old.y);
 assert.ok(walkable(map,u.x,u.y));
 assert.ok(Math.abs(u.x-old.x)+Math.abs(u.y-old.y)<=6);
});
test("cannot move someone else's unit or issue allied attacks",()=>{
 const m=createMatch(participants),map=makeMap({players:2});
 attachBattlefield(m,map);
 assert.throws(()=>command(m,{player:"a",action:"move",unitId:m.players[1].units[0].id,x:12,y:12}),/not owned/);
 // Distinct teams are allowed, but an allied match cannot attack itself.
 assert.throws(()=>issueAttack(m,"a",m.players[0].units[0].id,"a",m.players[0].units[1].id),/allied/);
});
test("tactical bot assigns explicit attacks when a battlefield exists",()=>{
 const m=createMatch(participants),map=makeMap({players:2,seed:42});
 attachBattlefield(m,map);
 enableBot(m,"b","Hard");
 step(m,10000);
 assert.ok(Object.values(m.orders).some(order=>order.kind==="attack"));
});

test("one long time advancement equals repeated one-second steps",()=>{
 const players=[{id:"a",faction:"Humans"},{id:"b",faction:"Ursa"}];
 const a=createMatch(players,74),b=createMatch(players,74);
 for(const m of [a,b])attachBattlefield(m,makeMap({seed:74,players:2}));
 command(a,{player:"a",action:"train",facility:"Town Center",role:"Worker"});
 command(b,{player:"a",action:"train",facility:"Town Center",role:"Worker"});
 step(a,30000);
 for(let i=0;i<30;i++)step(b,1000);
 assert.deepEqual(a,b);
});
