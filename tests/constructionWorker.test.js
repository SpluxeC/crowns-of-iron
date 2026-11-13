import test from "node:test";
import assert from "node:assert/strict";
import {createMatch,command,step} from "../src/simulation.js";
import {makeMap,canPlace,findPath} from "../src/map.js";
import {attachBattlefield} from "../src/battlefield.js";

test("a worker cannot serve two construction sites concurrently",()=>{
 const m=createMatch([{id:"a",faction:"Humans"},{id:"b",faction:"Orcs"}],9);
 const map=makeMap({seed:9,players:2});attachBattlefield(m,map);
 const worker=m.players[0].units[0],start=map.starts[0],sites=[];
 for(let y=0;y<map.height-3&&sites.length<2;y++)
  for(let x=0;x<map.width-3&&sites.length<2;x++){
   if(canPlace(map,x,y,2,2)&&findPath(map,{x:worker.x,y:worker.y},{x,y})&&Math.abs(x-start.x)+Math.abs(y-start.y)<9
      &&sites.every(s=>Math.abs(x-s.x)+Math.abs(y-s.y)>6))sites.push({x,y});
  }
 assert.equal(sites.length,2,"Seeded map should provide two reachable Shelter sites");
 const initial=m.players[0].resources.Wood;
 command(m,{player:"a",action:"build",kind:"Shelter",...sites[0],workers:[worker.id]});
 assert.throws(()=>command(m,{player:"a",action:"build",kind:"Shelter",...sites[1],workers:[worker.id]}),/already assigned/);
 assert.equal(m.players[0].resources.Wood,initial-60);
 step(m,24000);
 assert.equal(m.players[0].popCap,25);
});
