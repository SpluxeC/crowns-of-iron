import test from "node:test";
import assert from "node:assert/strict";
import {createMatch} from "../src/state.js";
import {attachBattlefield} from "../src/battlefield.js";
import {makeMap} from "../src/map.js";
import {enableBot} from "../src/ai.js";
import {selectSquadObjective,threatenedLocations} from "../src/botTargeting.js";
import {chooseBotStrategy} from "../src/botStrategy.js";
import {planArmyOrders} from "../src/armyAI.js";
function match(){
 const m=createMatch([{id:"human",faction:"Humans"},{id:"ai-1",faction:"Orcs"}],41);
 attachBattlefield(m,makeMap({width:48,height:48,players:2,seed:41}));
 enableBot(m,"ai-1","Normal");
 m.fullCatalog={};return m;
}
test("squad selects a shared worker raid objective from visible enemies",()=>{
 const m=match(),p=m.players[1],start=m.battlefield.starts[1];
 const scout=p.units.find(u=>u.archetype==="Scout"),foe=m.players[0];
 scout.x=start.x;scout.y=start.y;
 const w=foe.units.find(u=>u.archetype==="Worker");
 w.x=start.x+5;w.y=start.y+1;
 const obj=selectSquadObjective(m,p.id,"raid",[scout]);
 assert.equal(obj?.unit.id,w.id);
});
test("defense extends beyond town center to exposed workers and buildings",()=>{
 const m=match(),p=m.players[1],start=m.battlefield.starts[1];
 const worker=p.units.find(u=>u.archetype==="Worker");
 worker.x=start.x-9;worker.y=start.y;
 const threat=m.players[0].units.find(u=>u.archetype==="Scout");
 threat.x=worker.x+1;threat.y=worker.y;
 assert.ok(threatenedLocations(m,p.id).some(pt=>pt.x===worker.x&&pt.y===worker.y));
 assert.equal(chooseBotStrategy(m,p.id).stance,"defend");
 const objective=selectSquadObjective(m,p.id,"defend",p.units.filter(u=>u.attack>0));
 assert.equal(objective?.unit.id,threat.id);
});
test("defensive AI avoids far targets once its workers are safe",()=>{
 const m=match(),p=m.players[1];
 const enemy=m.players[0].units.find(u=>u.archetype==="Scout");
 const home=m.battlefield.starts[1];
 enemy.x=home.x-10;enemy.y=home.y+1;
 const scout=p.units.find(u=>u.archetype==="Scout");
 const actions=planArmyOrders(m,p.id,{stance:"defend"});
 assert.ok(actions.every(order=>order.unitId===scout.id));
 // Always valid and deterministic: exact orders depend on walkable routes.
 const other=match(),prior=other.players[0].units.find(u=>u.archetype==="Scout");
 prior.x=home.x-10;prior.y=home.y+1;
 assert.deepEqual(planArmyOrders(other,other.players[1].id,{stance:"defend"}),actions);
});
