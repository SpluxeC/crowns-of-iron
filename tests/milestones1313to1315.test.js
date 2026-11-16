import test from "node:test";
import assert from "node:assert/strict";
import {createMatch} from "../src/state.js";
import {attachBattlefield} from "../src/battlefield.js";
import {makeMap} from "../src/map.js";
import {enableBot} from "../src/ai.js";
import {assessBotThreat,chooseBotStrategy} from "../src/botStrategy.js";
import {analyzeMirroredMatchups} from "../src/mirroredMatchupDiagnostics.js";
function fixture(){
 const m=createMatch([{id:"human",faction:"Humans"},{id:"ai-1",faction:"Orcs"}],41);
 attachBattlefield(m,makeMap({width:48,height:48,players:2,seed:41}));
 enableBot(m,"ai-1","Normal");
 m.fullCatalog={};return m;
}
test("emergency hostile military threat interrupts an offensive cooldown",()=>{
 const m=fixture(),id="ai-1",bot=m.bots[id],home=m.battlefield.starts[1];
 bot.stance="raid";bot.stanceChangedAtMs=1000;m.elapsedMs=2000;
 const enemy=m.players[0].units.find(u=>u.archetype==="Scout");
 enemy.x=home.x;enemy.y=home.y;
 const result=chooseBotStrategy(m,id);
 assert.equal(result.stance,"defend");
 assert.equal(result.changed,true);
 assert.equal(bot.stanceChangedAtMs,2000);
});
test("peaceful enemy workers are not treated as an armed attack",()=>{
 const m=fixture(),id="ai-1",worker=m.players[1].units.find(u=>u.archetype==="Worker");
 const foe=m.players[0].units.find(u=>u.archetype==="Worker");
 foe.x=worker.x;foe.y=worker.y;
 const armed=m.players[0].units.filter(u=>u.attack>0);
 for(const u of armed){u.x=m.battlefield.starts[0].x;u.y=m.battlefield.starts[0].y;}
 const threat=assessBotThreat(m,id);
 assert.equal(threat.workersThreatened,0);
});
test("defense cooldown still prevents immediately switching back to raid",()=>{
 const m=fixture(),id="ai-1",bot=m.bots[id];
 bot.stance="defend";bot.stanceChangedAtMs=1000;m.elapsedMs=2000;
 assert.equal(chooseBotStrategy(m,id).stance,"defend");
});
test("mirrored report splits wins by side and excludes unresolved from victories",()=>{
 const rows=[
  {left:"Humans",right:"Orcs",seed:42,actualWinner:"Humans",unresolved:false,leader:"Humans"},
  {left:"Orcs",right:"Humans",seed:42,actualWinner:null,unresolved:true,leader:"Orcs"}
 ];
 const out=analyzeMirroredMatchups(rows,["Humans","Orcs"]);
 assert.equal(out.resolved,1);assert.equal(out.unresolved,1);
 assert.equal(out.leftWins,1);assert.equal(out.rightWins,0);
 assert.equal(out.factionSummary[0].resolvedWins,1);
 assert.equal(out.factionSummary[1].scoreLeads,1);
 assert.equal(out.pairs[0].unresolved,1);
});
test("mirrored report rejects missing reverse fixture and invalid winner",()=>{
 const a={left:"Humans",right:"Orcs",seed:1,actualWinner:"Humans",unresolved:false};
 assert.throws(()=>analyzeMirroredMatchups([a],["Humans","Orcs"]),/opposite-side/);
 assert.throws(()=>analyzeMirroredMatchups([a,{...a,left:"Orcs",right:"Humans",actualWinner:"Ursa"}],["Humans","Orcs"]),/Invalid match resolution/);
});
