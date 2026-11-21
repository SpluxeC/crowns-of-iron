import test from "node:test";
import assert from "node:assert/strict";
import {createMatch} from "../src/state.js";
import {makeMap} from "../src/map.js";
import {attachBattlefield} from "../src/battlefield.js";
import {planArmyOrders,defensiveAttackAllowed} from "../src/armyAI.js";
import {mandatoryHarvestOrder,harvestResourceOptions} from "../src/spatialBot.js";
import {battlefieldRenderSize} from "../web/mobilePerformance.js";

test("defensive AI threat filter excludes civilian workers in legacy and catalog games",()=>{
 const worker={archetype:"Worker",attack:4};
 const armed={archetype:"Scout",attack:8};
 assert.equal(defensiveAttackAllowed(worker,"defend"),false);
 assert.equal(defensiveAttackAllowed(armed,"defend"),true);
 assert.equal(defensiveAttackAllowed({...armed,attack:0},"defend"),false);
 assert.equal(defensiveAttackAllowed(worker,"raid"),true);
});
test("legacy defense does not target nearby enemy workers even if they can be attacked",()=>{
 const m=createMatch([{id:"human",faction:"Humans"},{id:"ai",faction:"Orcs"}],17);
 const map=makeMap({seed:17,width:48,height:48,players:2});
 for(const t of map.tiles){t.terrain="grass";t.occupied=null;}
 attachBattlefield(m,map);
 const p=m.players[1],other=m.players[0],home=map.starts[1];
 const guard=p.units.find(u=>u.archetype==="Scout");
 guard.x=home.x;guard.y=home.y;
 for(const unit of other.units){unit.alive=false;}
 const civilian=other.units.find(u=>u.archetype==="Worker");
 civilian.alive=true;civilian.x=home.x+2;civilian.y=home.y;
 const assignments=planArmyOrders(m,"ai",{stance:"defend"});
 assert.deepEqual(assignments,[]);
 assert.equal(m.orders?.[guard.id],undefined);
});
test("mandatory input harvest ranking preserves stable shortage order",()=>{
 const priorities=["Food","Wood","Metal","Gold","Stone"];
 const deficits={Metal:120,Gold:20};
 const sorted=mandatoryHarvestOrder(priorities,deficits);
 assert.deepEqual(sorted,["Metal","Gold","Food","Wood","Stone"]);
 assert.deepEqual(harvestResourceOptions(sorted,"Metal"),["Metal"]);
 assert.deepEqual(priorities,["Food","Wood","Metal","Gold","Stone"]);
 assert.deepEqual(mandatoryHarvestOrder(priorities,{}),priorities);
});
test("mobile framebuffer never exceeds the exact pixel cap at boundary dimensions",()=>{
 for(const [w,h] of [[2048,1200],[1999,1111],[1440,900],[2400,1080],[9999,9999],[2000,1999],[2800,1100]]){
  for(const mobile of [true,false]){
   const out=battlefieldRenderSize(w,h,1.35,{mobile});
   assert.ok(out.width>0&&out.height>0);
   assert.ok(out.width<=2048&&out.height<=2048);
   assert.ok(out.width*out.height<=(mobile?1500000:3000000),
    `oversized canvas ${w}x${h} mobile=${mobile}: ${out.width}x${out.height}`);
  }
 }
});
