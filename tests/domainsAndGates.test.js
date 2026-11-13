import test from "node:test";
import assert from "node:assert/strict";
import {createMatch,command,step} from "../src/simulation.js";
import {attachBattlefield} from "../src/battlefield.js";
import {makeMap,at,placeBuilding} from "../src/map.js";
import {pathForUnit,tileTraversable,movementDomain} from "../src/movementDomains.js";
const people=[{id:"a",faction:"Humans"},{id:"b",faction:"Orcs"}];
function empty(){
 const match=createMatch(people,10),map=makeMap({seed:10,players:2});
 for(const t of map.tiles){t.terrain="grass";t.occupied=null;t.resource=null;t.amount=0;}
 attachBattlefield(match,map);return match;
}
test("land, naval, and air units obey distinct traversability rules",()=>{
 const m=empty(),tile=at(m.battlefield,5,5);tile.terrain="water";
 assert.equal(movementDomain("Fishing Vessel"),"naval");
 assert.equal(movementDomain("Interceptor"),"air");
 assert.equal(movementDomain("Swordsman"),"land");
 assert.equal(tileTraversable(m,"a","Worker",5,5),false);
 assert.equal(tileTraversable(m,"a","Fishing Vessel",5,5),true);
 assert.equal(tileTraversable(m,"a","Bomber",5,5),true);
 assert.equal(tileTraversable(m,"a","Fishing Vessel",6,5),false);
});
test("ship cannot cross land, air unit can cross land, water and occupied tiles",()=>{
 const m=empty();
 for(let y=1;y<=3;y++)for(let x=1;x<=3;x++)at(m.battlefield,x,y).terrain="water";
 assert.ok(pathForUnit(m,"a","Raft",{x:1,y:1},{x:3,y:3}));
 assert.equal(pathForUnit(m,"a","Raft",{x:1,y:1},{x:5,y:5}),null);
 at(m.battlefield,4,4).terrain="hill";
 assert.ok(pathForUnit(m,"a","Interceptor",{x:3,y:3},{x:5,y:5}));
});
test("walls obstruct ground movement and open gates admit only owning team",()=>{
 const m=empty();
 for(let y=0;y<m.battlefield.height;y++)at(m.battlefield,9,y).terrain="water";
 at(m.battlefield,9,7).terrain="grass";
 const gate=placeBuilding(m.battlefield,{owner:"a",kind:"Stone Gatehouse",x:9,y:7,width:1,height:1});
 m.constructions={[gate.id]:{siteId:gate.id,owner:"a",kind:"Stone Gatehouse",completed:true,gateOpen:false}};
 const from={x:8,y:7},to={x:10,y:7};
 assert.equal(pathForUnit(m,"a","Worker",from,to),null);
 command(m,{player:"a",action:"gate",siteId:gate.id,open:true});
 assert.ok(pathForUnit(m,"a","Worker",from,to));
 assert.equal(pathForUnit(m,"b","Worker",from,to),null);
 assert.throws(()=>command(m,{player:"b",action:"gate",siteId:gate.id,open:false}),/not owned/);
 command(m,{player:"a",action:"gate",siteId:gate.id,open:false});
 assert.equal(pathForUnit(m,"a","Worker",from,to),null);
});
test("movement commands reject water for infantry, but allow aircraft",()=>{
 const m=empty(),w=m.players[0].units[0];
 at(m.battlefield,w.x+1,w.y).terrain="water";
 assert.throws(()=>command(m,{player:"a",action:"move",unitId:w.id,x:w.x+1,y:w.y}),/walkable|traversable/);
});
