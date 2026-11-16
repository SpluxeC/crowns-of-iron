import test from "node:test";
import assert from "node:assert/strict";
import {createMatch} from "../src/state.js";
import {attachBattlefield} from "../src/battlefield.js";
import {makeMap} from "../src/map.js";
import {enableBot} from "../src/ai.js";
import {assessBotThreat,chooseBotStrategy} from "../src/botStrategy.js";
function fixture(difficulty="Hard"){
 const m=createMatch([{id:"human",faction:"Humans"},{id:"ai-1",faction:"Orcs"}],41);
 attachBattlefield(m,makeMap({width:48,height:48,players:2,seed:41}));
 enableBot(m,"ai-1",difficulty);
 return m;
}
test("AI defaults to assault when military pressure is absent",()=>{
 const m=fixture();
 const plan=chooseBotStrategy(m,"ai-1");
 assert.equal(plan.stance,"assault");
 assert.equal(plan.changed,false);
 assert.ok(plan.threat.army>=1);
});
test("AI defends when enemies reach its base and waits before switching",()=>{
 const m=fixture(),start=m.battlefield.starts[1],enemy=m.players[0].units.find(u=>u.archetype==="Scout");
 enemy.x=start.x;enemy.y=start.y;
 const plan=chooseBotStrategy(m,"ai-1");
 assert.equal(plan.stance,"defend");
 assert.ok(plan.changed);assert.ok(plan.threat.nearby>=1);
 enemy.x=m.battlefield.starts[0].x;enemy.y=m.battlefield.starts[0].y;
 m.elapsedMs=2000;
 assert.equal(chooseBotStrategy(m,"ai-1").stance,"defend");
 m.elapsedMs=20000;
 assert.equal(chooseBotStrategy(m,"ai-1").stance,"assault");
});
test("large trained AI armies raid when outnumbering enemies",()=>{
 const m=fixture("Normal");
 const ai=m.players[1];
 const unit=ai.units.find(u=>u.archetype==="Scout");
 for(let i=0;i<7;i++)ai.units.push({...unit,id:"extra-"+i,x:unit.x,y:unit.y});
 assert.equal(chooseBotStrategy(m,"ai-1").stance,"raid");
 const easy=fixture("Easy");
 for(let i=0;i<7;i++)easy.players[1].units.push({...easy.players[1].units[3],id:"ez-"+i});
 assert.notEqual(chooseBotStrategy(easy,"ai-1").stance,"raid");
});
test("threat assessment remains deterministic for fixed state",()=>{
 const m=fixture();
 const a=assessBotThreat(m,"ai-1"),b=assessBotThreat(m,"ai-1");
 assert.deepEqual(a,b);
});
