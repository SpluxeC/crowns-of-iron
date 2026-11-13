import test from "node:test";
import assert from "node:assert/strict";
import {createMatch,command,step} from "../src/simulation.js";
import {makeMap,at} from "../src/map.js";
import {attachBattlefield} from "../src/battlefield.js";
const players=[{id:"a",faction:"Humans"},{id:"b",faction:"Orcs"}];
test("finite resource deposit cannot be mined beyond its remaining quantity",()=>{
 const m=createMatch(players,7),map=makeMap({seed:7,players:2});
 attachBattlefield(m,map);
 const start=map.starts[0],tile=at(map,start.x+3,start.y),worker=m.players[0].units[0];
 assert.equal(tile.resource,"Food");
 worker.x=tile.x-1;worker.y=tile.y;
 tile.amount=3;
 const before=m.players[0].resources.Food;
 const r=command(m,{player:"a",action:"harvest",workerId:worker.id,x:tile.x,y:tile.y});
 assert.equal(r.amount,3);assert.equal(tile.amount,0);
 assert.equal(m.players[0].resources.Food,before+3);
 assert.throws(()=>command(m,{player:"a",action:"harvest",workerId:worker.id,x:tile.x,y:tile.y}),/cooldown|depleted/);
 step(m,2000);
 assert.throws(()=>command(m,{player:"a",action:"harvest",workerId:worker.id,x:tile.x,y:tile.y}),/depleted/);
});
test("cannot remotely gather across the map or use enemy worker",()=>{
 const m=createMatch(players,3),map=makeMap({seed:3,players:2});attachBattlefield(m,map);
 const tile=at(map,map.starts[0].x+3,map.starts[0].y);
 assert.throws(()=>command(m,{player:"a",action:"harvest",workerId:m.players[0].units[0].id,x:tile.x,y:tile.y}),/too far/);
 assert.throws(()=>command(m,{player:"a",action:"harvest",workerId:m.players[1].units[0].id,x:tile.x,y:tile.y}),/Worker/);
});
