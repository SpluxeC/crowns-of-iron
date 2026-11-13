import test from "node:test";
import assert from "node:assert/strict";
import {createMatch,command,step} from "../src/simulation.js";
import {makeMap,canPlace} from "../src/map.js";
import {attachBattlefield} from "../src/battlefield.js";
import {destroyToRuin} from "../src/ruins.js";
const players=[{id:"a",faction:"Humans"},{id:"b",faction:"Orcs"}];
function setup(){
 const m=createMatch(players,21),map=makeMap({seed:21,players:2});
 attachBattlefield(m,map);
 const s=map.starts[0],p=m.players[0],worker=p.units[0];
 let position;
 for(let radius=3;radius<=8&&!position;radius++)
  for(let dy=-radius;dy<=radius&&!position;dy++)
   for(let dx=-radius;dx<=radius;dx++)
    if(canPlace(map,s.x+dx,s.y+dy,3,3)){position={x:s.x+dx,y:s.y+dy};break;}
 assert.ok(position);
 const id=command(m,{player:"a",action:"build",kind:"Training Camp",...position,workers:[worker.id]});
 step(m,40000);
 assert.equal(m.constructions[id].completed,true);
 return {m,p,worker,id,position};
}
test("salvage recovers controlled materials exactly once",()=>{
 const {m,p,id}=setup();
 destroyToRuin(m,id);
 const before=p.resources.Wood;
 const reward=command(m,{player:"a",action:"salvage",siteId:id});
 assert.equal(reward.Wood,10);
 assert.equal(p.resources.Wood,before+10);
 assert.throws(()=>command(m,{player:"a",action:"salvage",siteId:id}),/not available/);
});
test("reconstruction is 75% resources and 70% time",()=>{
 const {m,p,worker,id}=setup();
 destroyToRuin(m,id);
 const before=p.resources.Wood;
 const newId=command(m,{player:"a",action:"rebuild",siteId:id,workers:[worker.id]});
 assert.equal(p.resources.Wood,before-75);
 assert.equal(m.constructions[newId].durationMs,28000);
 step(m,28000);
 assert.equal(m.constructions[newId].completed,true);
});
test("ruins expire after five minutes",()=>{
 const {m,id}=setup();
 destroyToRuin(m,id);
 for(let i=0;i<5;i++)step(m,60000);
 assert.equal(m.ruins[id],undefined);
});
