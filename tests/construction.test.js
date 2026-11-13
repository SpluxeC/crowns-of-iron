import test from "node:test";
import assert from "node:assert/strict";
import {createMatch,command,step} from "../src/simulation.js";
import {makeMap,canPlace} from "../src/map.js";
import {attachBattlefield} from "../src/battlefield.js";
import {startConstruction,cancelConstruction,destroyStructure} from "../src/construction.js";
const participants=[{id:"a",faction:"Humans"},{id:"b",faction:"Orcs"}];
function setup(){
 const m=createMatch(participants,19),map=makeMap({seed:19,players:2});
 attachBattlefield(m,map);
 const w=m.players[0].units[0],s=map.starts[0];
 let spot=null;
 for(let dy=-8;dy<=8&&!spot;dy++)for(let dx=-8;dx<=8;dx++){
  const x=s.x+dx,y=s.y+dy;
  if(canPlace(map,x,y,3,3)){spot={x,y};break;}
 }
 assert.ok(spot);
 return {m,w,spot};
}
test("workers create a construction site, deduct costs and complete a facility",()=>{
 const {m,w,spot}=setup(),p=m.players[0];
 const id=command(m,{player:"a",action:"build",kind:"Training Camp",...spot,workers:[w.id]});
 assert.equal(p.resources.Wood,100);
 assert.equal(p.resources.Stone,60);
 assert.ok(m.battlefield.structures.some(s=>s.id===id));
 step(m,40000);
 assert.equal(m.constructions[id].completed,true);
 assert.equal(p.facilities["Training Camp"],1);
 assert.ok(p.unitQueues["Training Camp#1"]);
});
test("unfinished construction cancellations honor unstarted and active refund rules",()=>{
 const {m,w,spot}=setup(),p=m.players[0];
 const initial=p.resources.Wood;
 const id=startConstruction(m,"a","Training Camp",spot.x,spot.y,[w.id]);
 cancelConstruction(m,"a",id);
 assert.equal(p.resources.Wood,initial);
 const again=startConstruction(m,"a","Training Camp",spot.x,spot.y,[w.id]);
 step(m,10000);
 cancelConstruction(m,"a",again);
 assert.equal(p.resources.Wood,initial-25);
});
test("invalid placement does not spend resources; destruction frees tile footprint",()=>{
 const {m,w,spot}=setup(),p=m.players[0];
 const id=startConstruction(m,"a","Training Camp",spot.x,spot.y,[w.id]);
 const balance=p.resources.Wood;
 assert.throws(()=>startConstruction(m,"a","Training Camp",spot.x,spot.y,[w.id]),/placement/);
 assert.equal(p.resources.Wood,balance);
 step(m,40000);destroyStructure(m,id);
 assert.equal(p.facilities["Training Camp"],0);
 assert.ok(canPlace(m.battlefield,spot.x,spot.y,3,3));
});
test("workers cannot build age-locked buildings in Age I",()=>{
 const {m,w,spot}=setup();
 assert.throws(()=>startConstruction(m,"a","Barracks",spot.x,spot.y,[w.id]),/age locked/);
});
