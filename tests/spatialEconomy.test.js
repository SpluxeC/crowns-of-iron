import test from "node:test";
import assert from "node:assert/strict";
import {createMatch,command,step} from "../src/simulation.js";
import {makeMap,at} from "../src/map.js";
import {attachBattlefield} from "../src/battlefield.js";
import {setEconomyMode,assignHarvestJob,deliverCargo} from "../src/spatialEconomy.js";
function scenario(){
 const m=createMatch([{id:"a",faction:"Humans"},{id:"b",faction:"Orcs"}],33);
 attachBattlefield(m,makeMap({seed:33,players:2}));setEconomyMode(m,"spatial");
 return m;
}
test("spatial mode disables passive abstract gathering entirely",()=>{
 const m=scenario(),p=m.players[0],initial=p.resources.Food;
 step(m,30000);
 assert.equal(p.resources.Food,initial);
});
test("spatial harvest extracts only finite Food, carries it and deposits at home",()=>{
 const m=scenario(),p=m.players[0],start=m.battlefield.starts[0],target=at(m.battlefield,start.x+3,start.y);
 const worker=p.units[0],initial=p.resources.Food;
 target.amount=20;
 assignHarvestJob(m,"a",worker.id,target.x,target.y);
 for(let i=0;i<35;i++)step(m,1000);
 assert.equal(target.amount,0);
 assert.equal(p.resources.Food,initial+20);
 assert.equal(worker.cargo.amount,0);
});
test("spatial harvest forbids enemy ownership and age-locked Metal extraction",()=>{
 const m=scenario(),start=m.battlefield.starts[0],metal=at(m.battlefield,start.x+3,start.y+2);
 assert.equal(metal.resource,"Metal");
 assert.throws(()=>assignHarvestJob(m,"a",m.players[1].units[0].id,metal.x,metal.y),/owned positioned worker/);
 assert.throws(()=>assignHarvestJob(m,"a",m.players[0].units[0].id,metal.x,metal.y),/age locked/);
});
test("worker cannot teleport cargo into stockpile when far from depot",()=>{
 const m=scenario(),p=m.players[0],w=p.units[0],s=m.battlefield.starts[0];
 w.cargo={resource:"Wood",amount:11};w.x=s.x+3;w.y=s.y+1;
 assert.throws(()=>deliverCargo(m,"a",w.id),/not at a depot/);
 assert.equal(p.resources.Wood,200);
});
test("changing economy modes mid-match is prohibited",()=>{
 const m=scenario();step(m,1000);
 assert.throws(()=>setEconomyMode(m,"abstract"),/before play/);
});
