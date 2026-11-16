import test from "node:test";
import assert from "node:assert/strict";
import {shouldDefenderRetarget} from "../src/armyAI.js";
import {analyzeMirroredMatchups} from "../src/mirroredMatchupDiagnostics.js";

test("defender abandons a distant worker raid to defend against a close attacker",()=>{
 const unit={id:"guard",x:10,y:10};
 const raid={id:"worker",x:18,y:11,archetype:"Worker",hp:100};
 const attacker={id:"raider",x:11,y:10,archetype:"Scout",hp:100};
 assert.equal(shouldDefenderRetarget(unit,raid,attacker),true);
 assert.equal(shouldDefenderRetarget(unit,attacker,attacker),false);
});
test("defender avoids retargeting to a much less important distant objective",()=>{
 const guard={id:"guard",x:10,y:10};
 const attacker={id:"attacker",x:10,y:11,archetype:"Scout",hp:100};
 const distant={id:"distant",x:35,y:35,archetype:"Scout",hp:100};
 assert.equal(shouldDefenderRetarget(guard,attacker,distant),false);
});
test("mirrored diagnostic is independent of input fixture sequence",()=>{
 const a={left:"Humans",right:"Orcs",seed:110,actualWinner:"Humans",unresolved:false,leader:"Humans"};
 const b={left:"Orcs",right:"Humans",seed:110,actualWinner:"Orcs",unresolved:false,leader:"Orcs"};
 const first=analyzeMirroredMatchups([a,b],["Humans","Orcs"]);
 const reversed=analyzeMirroredMatchups([b,a],["Humans","Orcs"]);
 assert.equal(first.leftWins,2);
 assert.equal(first.rightWins,0);
 assert.equal(first.splitPairs,1);
 assert.deepEqual(first.factionSummary,reversed.factionSummary);
 assert.deepEqual(first.pairs.map(({pair,seed,resolved,unresolved,firstWins,secondWins,splitDecisions})=>
  ({pair,seed,resolved,unresolved,firstWins,secondWins,splitDecisions})),
  reversed.pairs.map(({pair,seed,resolved,unresolved,firstWins,secondWins,splitDecisions})=>
   ({pair,seed,resolved,unresolved,firstWins,secondWins,splitDecisions})));
});
