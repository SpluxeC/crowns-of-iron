import test from "node:test";
import assert from "node:assert/strict";
import {createMatch,command,step} from "../src/simulation.js";
import {makeMap,at} from "../src/map.js";
import {attachBattlefield} from "../src/battlefield.js";
import {makeUnit,killUnit} from "../src/state.js";
import {ALL_ARCHETYPES} from "../src/extendedCatalog.js";
import {embark,disembark,transportCapacity} from "../src/transports.js";
import {refreshUnitTechnology} from "../src/technologyEffects.js";
function fixture(role="Transport Ship"){
 const m=createMatch([{id:"a",faction:"Humans"},{id:"b",faction:"Orcs"}],42);
 const map=makeMap({seed:42,players:2});
 for(const t of map.tiles){t.terrain="grass";t.occupied=null;t.resource=null;t.amount=0;}
 attachBattlefield(m,map);
 const player=m.players[0],unit=makeUnit(player,role,ALL_ARCHETYPES[role],"carrier");
 unit.x=10;unit.y=10;player.units.push(unit);player.popUsed+=unit.pop;
 if(role==="Transport Ship")at(map,10,10).terrain="water";
 const passenger=player.units[0];passenger.x=10;passenger.y=11;
 return {m,player,unit,passenger,map};
}
test("shipping workers reserves population and removes passenger from battlefield",()=>{
 const {m,player,unit,passenger}=fixture(),used=player.popUsed;
 const result=embark(m,"a",unit.id,passenger.id);
 assert.equal(result.occupied,1);assert.equal(passenger.x,null);
 assert.equal(passenger.embarkedAt,unit.id);
 assert.equal(player.popUsed,used);
 assert.throws(()=>command(m,{player:"a",action:"move",unitId:passenger.id,x:11,y:11}),/position|embarked/);
 assert.throws(()=>embark(m,"b",unit.id,passenger.id),/transport required/);
});
test("unloading is atomic and chooses distinct safe land tiles",()=>{
 const {m,player,unit,passenger}=fixture();
 const other=player.units[1];other.x=11;other.y=10;
 embark(m,"a",unit.id,passenger.id);
 embark(m,"a",unit.id,other.id);
 const occupiedBefore=transportCapacity(player,unit.id).used;
 const out=disembark(m,"a",unit.id,[passenger.id,other.id]);
 assert.equal(out.length,2);assert.notDeepEqual(out[0],out[1]);
 assert.equal(transportCapacity(player,unit.id).used,0);
 assert.equal(occupiedBefore,2);
 assert.equal(passenger.embarkedAt,null);
});
test("an ocean-bound ship cannot unload troops without land",()=>{
 const {m,unit,passenger,map}=fixture();
 for(let y=8;y<=12;y++)for(let x=8;x<=12;x++)at(map,x,y).terrain="water";
 passenger.x=10;passenger.y=11;
 embark(m,"a",unit.id,passenger.id);
 assert.throws(()=>disembark(m,"a",unit.id,[passenger.id]),/landing tiles/);
 assert.equal(passenger.embarkedAt,unit.id);
});
test("passengers die when their transport is destroyed and population is released",()=>{
 const {m,player,unit,passenger}=fixture();
 embark(m,"a",unit.id,passenger.id);
 const before=player.popUsed;
 killUnit(player,unit.id);step(m,1000);
 assert.equal(passenger.alive,false);
 assert.equal(passenger.embarkedAt,null);
 assert.equal(player.popUsed,before-unit.pop-passenger.pop);
});
test("NAV-04 increases real embark capacity for an existing ship",()=>{
 const {m,player,unit}=fixture();
 unit.passengerCapacity=0;unit.basePassengerCapacity=0;
 const passenger=player.units[0];passenger.x=10;passenger.y=11;
 assert.throws(()=>embark(m,"a",unit.id,passenger.id),/capacity/);
 player.completed.push("NAV-04");refreshUnitTechnology(player,unit);
 assert.equal(unit.passengerCapacity,2);
 embark(m,"a",unit.id,passenger.id);
});
test("air transport can unload over ground but not teleport passengers across map",()=>{
 const {m,unit,passenger}=fixture("Air Transport");
 embark(m,"a",unit.id,passenger.id);
 unit.x=40;unit.y=40;
 assert.throws(()=>disembark(m,"b",unit.id,[passenger.id]),/transport required/);
 assert.ok(disembark(m,"a",unit.id,[passenger.id])[0].x>=38);
});
