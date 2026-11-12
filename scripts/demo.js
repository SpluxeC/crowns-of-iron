import {createMatch,command,step,checksum} from "../src/simulation.js";
const m=createMatch([{id:"human",faction:"Humans"},{id:"orc",faction:"Orcs"}],42);
for(let i=0;i<24;i++)step(m,10000);
command(m,{player:"human",action:"research",facility:"Town Center",id:"CIV-01"});
for(let i=0;i<5;i++)step(m,10000);
command(m,{player:"human",action:"train",facility:"Town Center",role:"Worker"});
step(m,20000);
console.log(JSON.stringify({milestone:"0.1–0.4 headless demo",seconds:m.elapsedMs/1000,checksum:checksum(m),
 players:m.players.map(p=>({id:p.id,faction:p.faction,age:p.age,pop:p.popUsed,resources:p.resources,completed:p.completed,units:p.units.length})),winner:m.winner},null,2));
