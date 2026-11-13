import test from "node:test";
import assert from "node:assert/strict";
import {createMatch,step,command} from "../src/simulation.js";
import {makeMap,at,placeBuilding} from "../src/map.js";
import {attachBattlefield} from "../src/battlefield.js";
import {spawnUnitOnDomain,movementDomain} from "../src/movementDomains.js";
import {makeUnit} from "../src/state.js";
import {ALL_ARCHETYPES} from "../src/extendedCatalog.js";
const people=[{id:"a",faction:"Humans"},{id:"b",faction:"Orcs"}];
test("ships launch only in adjacent water, never auto-correct onto ground",()=>{
 const m=createMatch(people,11),map=makeMap({seed:11,players:2});
 for(const tile of map.tiles){tile.terrain="grass";tile.occupied=null;tile.resource=null;}
 attachBattlefield(m,map);
 const start=map.starts[0],p=m.players[0];
 const dock=placeBuilding(map,{owner:"a",kind:"Dock",x:start.x+5,y:start.y,width:2,height:2});
 m.constructions={[dock.id]:{siteId:dock.id,owner:"a",kind:"Dock",completed:true,facilityKey:"Dock#1"}};
 const vessel=makeUnit(p,"Fishing Vessel",ALL_ARCHETYPES["Fishing Vessel"],"vessel");
 spawnUnitOnDomain(m,p,vessel,"Dock#1");
 assert.equal(vessel.x,null);
 p.units.push(vessel);p.popUsed+=vessel.pop;
 step(m,1000);
 assert.equal(vessel.x,null);
 at(map,dock.x+2,dock.y).terrain="water";
 spawnUnitOnDomain(m,p,vessel,"Dock#1");
 assert.equal(vessel.x,dock.x+2);assert.equal(vessel.y,dock.y);
 assert.equal(movementDomain(vessel.archetype),"naval");
 assert.throws(()=>command(m,{player:"a",action:"move",unitId:vessel.id,x:start.x,y:start.y}),/walkable|traversable/);
});
