import test from "node:test";
import assert from "node:assert/strict";
import {createMatch,command,step,checksum} from "../src/simulation.js";
import {eventRecorder,exportSave,importSave,replayEvents} from "../src/persistence.js";
const participants=[{id:"one",faction:"Tree Elves"},{id:"two",faction:"Dwarfs"}];
test("save and restore exact match data with checksum",()=>{
 const m=createMatch(participants,77);
 command(m,{player:"one",action:"train",facility:"Town Center",role:"Worker"});
 step(m,15000);
 const saved=exportSave(m),restored=importSave(saved);
 assert.equal(checksum(m),checksum(restored));
 assert.equal(restored.players[0].popUsed,5);
});
test("reject tampered save data",()=>{
 const m=createMatch(participants);
 const obj=JSON.parse(exportSave(m));obj.state.players[0].resources.Food=999999;
 assert.throws(()=>importSave(JSON.stringify(obj)),/checksum mismatch/);
 assert.throws(()=>importSave(JSON.stringify({...obj,version:999})),/Unsupported/);
});
test("record and replay command/tick streams deterministically",()=>{
 const r=eventRecorder(participants,12);
 r.command({player:"one",action:"train",facility:"Town Center",role:"Worker"});
 r.step(15000);r.step(10000);
 assert.equal(r.verify(),true);
 const exported=r.export();
 const rebuilt=replayEvents(exported.participants,exported.seed,exported.entries);
 assert.equal(checksum(rebuilt),checksum(r.match));
});
