import test from "node:test";
import assert from "node:assert/strict";
import {createMatch,command,step} from "../src/simulation.js";
import {makeIslandMap} from "../src/islandMaps.js";
import {attachBattlefield} from "../src/battlefield.js";
import {at,placeBuilding} from "../src/map.js";
import {makeUnit} from "../src/state.js";
import {ALL_ARCHETYPES} from "../src/extendedCatalog.js";
import {setEconomyMode} from "../src/spatialEconomy.js";
import {assignSeaTrade} from "../src/navalEconomy.js";
function fixture(){
 const m=createMatch([{id:"a",faction:"Humans"},{id:"b",faction:"Orcs"}],55);
 const map=makeIslandMap({seed:55,width:64,height:64,players:2});
 attachBattlefield(m,map);setEconomyMode(m,"spatial");
 const p=m.players[0];
 // Place two separate 1x1 test piers on the dry inland row above the southern sea edge.
 for(const x of [6,24]){const t=at(map,x,62);t.terrain="grass";t.occupied=null;}
 const one=placeBuilding(map,{owner:"a",kind:"Dock",x:6,y:62,width:1,height:1});
 const two=placeBuilding(map,{owner:"a",kind:"Dock",x:24,y:62,width:1,height:1});
 m.constructions={[one.id]:{siteId:one.id,owner:"a",kind:"Dock",completed:true},
 [two.id]:{siteId:two.id,owner:"a",kind:"Dock",completed:true}};
 const ship=makeUnit(p,"Trade Ship",ALL_ARCHETYPES["Trade Ship"],"trade-a");
 ship.x=6;ship.y=63;p.units.push(ship);p.popUsed+=ship.pop;
 return {m,p,map,ship,one,two};
}
test("finished sea routes pay Gold only after physically reaching another dock",()=>{
 const {m,p,ship,one,two}=fixture(),start=p.resources.Gold;
 assignSeaTrade(m,"a",ship.id,one.id,two.id);
 step(m,1000);assert.equal(p.resources.Gold,start);
 step(m,30000);assert.ok(p.resources.Gold>=start+40);
 assert.ok(m.seaTradeJobs[ship.id].completed>=1);
});
test("sea trading cannot be assigned from an enemy dock or unsupported ship",()=>{
 const {m,ship,one,two}=fixture();
 assert.throws(()=>assignSeaTrade(m,"b",ship.id,one.id,two.id),/Owned positioned/);
 assert.throws(()=>assignSeaTrade(m,"a",m.players[0].units[0].id,one.id,two.id),/Trade Ship/);
});
test("NAV-10, FAC-14 and ECO-09 increase actual completed trade revenue",()=>{
 const {m,p,ship,one,two}=fixture(),before=p.resources.Gold;
 p.completed.push("NAV-10","FAC-14","ECO-09");
 assignSeaTrade(m,"a",ship.id,one.id,two.id);
 step(m,30000);
 assert.ok(p.resources.Gold-before>=46);
});
test("fishing shoals are finite and NAV-03 increases catch",()=>{
 const {m,p,map}=fixture(),before=p.resources.Food;
 map.fishShoals=[{x:8,y:63,amount:15}];
 const fisher=makeUnit(p,"Fishing Vessel",ALL_ARCHETYPES["Fishing Vessel"],"fisher");
 fisher.x=8;fisher.y=63;p.units.push(fisher);p.popUsed+=fisher.pop;
 p.completed.push("NAV-03");
 step(m,30000);
 assert.equal(p.resources.Food-before,15);
 assert.equal(map.fishShoals[0].amount,0);
});
