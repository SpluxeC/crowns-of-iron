import {createMatch,step,checksum} from "../src/simulation.js";
import {enableBot,botSummary} from "../src/ai.js";
const match=createMatch([{id:"human",faction:"Humans"},{id:"orc",faction:"Orcs"}],20261112);
enableBot(match,"human","Normal");enableBot(match,"orc","Hard");
for(let i=0;i<180;i++)step(match,10000);
console.log(JSON.stringify({
  milestone:"0.7 economy-AI benchmark", elapsedMinutes:match.elapsedMs/60000,
  checksum:checksum(match),botSummary:botSummary(match),
  players:match.players.map(p=>({id:p.id,faction:p.faction,age:p.age,
    workers:p.units.filter(u=>u.alive&&u.archetype==="Worker").length,
    population:p.popUsed,completedMandatory:p.completed.length,resources:p.resources})),
  caveat:"No army tactics or player-versus-player combat AI in this benchmark"
},null,2));
