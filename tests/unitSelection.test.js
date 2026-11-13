import test from "node:test";
import assert from "node:assert/strict";
import {selectableUnits,unitsInTileRectangle,updateSelection,chooseAtTile,
 selectByRole,recallGroup,makeFormationPayload} from "../web/unitSelection.js";
const p={units:[
 {id:"w",archetype:"Worker",x:2,y:2,alive:true},
 {id:"a",archetype:"Swordsman",x:3,y:3,alive:true},
 {id:"b",archetype:"Archer",x:4,y:4,alive:true},
 {id:"dead",archetype:"Archer",x:3,y:2,alive:false},
 {id:"boat",archetype:"Swordsman",x:2,y:3,alive:true,embarkedAt:"ship"}
]};
test("selection rectangle excludes dead and embarked units and is input-order independent",()=>{
 assert.deepEqual(unitsInTileRectangle(p,{x:4,y:4},{x:2,y:2}),["a","b","w"]);
 assert.deepEqual(unitsInTileRectangle(p,{x:2,y:2},{x:4,y:4}),["a","b","w"]);
 assert.equal(selectableUnits(p).length,3);
 assert.equal(chooseAtTile(p,{x:3,y:3}).id,"a");
});
test("additive selection, toggling, limit and control group restoration",()=>{
 let selection=updateSelection(new Set(),["w","a"]);
 selection=updateSelection(selection,["b"],{add:true});
 assert.deepEqual([...selection],["w","a","b"]);
 selection=updateSelection(selection,["a"],{toggle:true});
 assert.deepEqual([...selection],["w","b"]);
 assert.deepEqual(recallGroup(p,["a","dead","w","a"]),["a","w"]);
 assert.deepEqual(selectByRole(p,"military"),["a","b"]);
 assert.deepEqual(selectByRole(p,"workers"),["w"]);
 assert.deepEqual([...updateSelection(new Set(),["w","a","b"],{limit:2})],["w","a"]);
});
test("formation request limited to 24 owned selected ids",()=>{
 const selected=new Set(Array.from({length:30},(_,i)=>"unit-"+i));
 assert.equal(makeFormationPayload(selected,5,9).units.length,24);
 assert.equal(makeFormationPayload(new Set(),5,9),null);
 assert.equal(makeFormationPayload(new Set(["a"]),5.5,1),null);
});
