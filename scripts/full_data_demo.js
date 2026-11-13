import {readFileSync} from "node:fs";
import {createMatch,command,step,checksum} from "../src/simulation.js";
import {installFullCatalog} from "../src/fullCatalog.js";
const data=JSON.parse(readFileSync("data/balance-v0.2.json","utf8"));
const match=createMatch([{id:"human",faction:"Humans"},{id:"ursa",faction:"Ursa"}],42);
const summary=installFullCatalog(match,data);
command(match,{player:"human",action:"research",facility:"Town Center",id:"CIV-01"});
step(match,45000);
command(match,{player:"human",action:"train",facility:"Town Center",role:"Worker"});
step(match,15000);
const newWorker=match.players[0].units.filter(u=>u.alive&&u.archetype==="Worker").at(-1);
console.log(JSON.stringify({summary,revision:match.fullCatalog.revision,
 firstResearch:match.players[0].completed,worker:{name:newWorker.name,hp:newWorker.hp,attack:newWorker.attack},
 checksum:checksum(match)},null,2));
