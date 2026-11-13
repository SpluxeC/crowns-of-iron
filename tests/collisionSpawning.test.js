import test from "node:test";
import assert from "node:assert/strict";
import {createMatch,command,step} from "../src/simulation.js";
import {attachBattlefield} from "../src/battlefield.js";
import {makeMap} from "../src/map.js";
import {enableUnitCollision,validateCollisionState} from "../src/unitCollision.js";
function setup(){
 const m=createMatch([{id:"a",faction:"Humans"},{id:"b",faction:"Orcs"}],62);
 const map=makeMap({seed:62,players:2});
 for(const t of map.tiles){t.terrain="grass";t.occupied=null;t.resource=null;}
 attachBattlefield(m,map);enableUnitCollision(m);
 return m;
}
test("new workers spawn in distinct traversable cells when collision is enabled",()=>{
 const m=setup();
 const before=m.players[0].units.length;
 command(m,{player:"a",action:"train",facility:"Town Center",role:"Worker"});
 step(m,20000);
 assert.equal(m.players[0].units.length,before+1);
 const fresh=m.players[0].units.at(-1);
 assert.ok(Number.isInteger(fresh.x)&&Number.isInteger(fresh.y));
 assert.equal(validateCollisionState(m).overlaps.length,0);
});
test("ready production job waits if every passable tile is occupied",()=>{
 const m=setup();
 const occupied=new Set(m.players.flatMap(p=>p.units.map(u=>u.x+","+u.y)));
 for(const t of m.battlefield.tiles)
  if(!occupied.has(t.x+","+t.y))t.terrain="hill";
 const p=m.players[0],before=p.units.length;
 command(m,{player:"a",action:"train",facility:"Town Center",role:"Worker"});
 step(m,20000);
 assert.equal(p.units.length,before);
 assert.equal(p.unitQueues["Town Center"].length,1);
 const home=m.battlefield.starts[0],open=m.battlefield.tiles.find(t=>
  t.x===home.x+4&&t.y===home.y);
 assert.ok(open&&!occupied.has(open.x+","+open.y));
 open.terrain="grass";
 step(m,1000);
 assert.equal(p.units.length,before+1);
 assert.deepEqual([p.units.at(-1).x,p.units.at(-1).y],[open.x,open.y]);
 assert.equal(validateCollisionState(m).overlaps.length,0);
});
