import test from "node:test";
import assert from "node:assert/strict";
import {FACTION_SLUGS} from "../web/factionArt.js";
import {buildingTheme,appendFactionArchitecture} from "../web/buildingArchitecture.js";
import {terrainAccent,appendTerrainAccents,ENVIRONMENT_DETAILS_CAP} from "../web/terrainAtmosphere.js";
const cube=(out,x,z,width,bottom,top,color)=>{
 assert([x,z,width,bottom,top].every(Number.isFinite));
 assert(width>0&&top>bottom);
 assert.match(color,/^#[0-9a-fA-F]{6}$/);
 out.push(x,z,width,bottom,top,color);
};
test("all six factions receive distinct bounded building details",()=>{
 const colored=new Set(),site={x:3,y:4,width:2,height:2};
 for(const faction of FACTION_SLUGS){
  const out=[],count=appendFactionArchitecture(out,site,faction,.12,cube);
  assert(count>=5&&count<=10);
  assert.equal(out.length,count*6);
  colored.add(buildingTheme(faction).trim);
  assert.deepEqual(out,(()=>{
   const repeat=[];appendFactionArchitecture(repeat,site,faction,.12,cube);
   return repeat;})());
 }
 assert.equal(colored.size,6);
 assert.equal(buildingTheme("unknown"),null);
 assert.equal(appendFactionArchitecture([],site,"unknown",.12,cube),0);
 assert.throws(()=>appendFactionArchitecture([],{x:1,y:2,width:0,height:1},
  "Orcs",0,cube),/Invalid/);
});
test("terrain accents are stable, bounded, and never reveal unknown fog",()=>{
 const tiles=Array.from({length:600},(_,i)=>({x:i%30,
  y:Math.floor(i/30),terrain:["grass","forest","hill","water","deposit"][i%5]}));
 const out=[],count=appendTerrainAccents(out,tiles,cube);
 assert(count>0&&count<=ENVIRONMENT_DETAILS_CAP);
 assert.equal(out.length,count*6);
 const repeated=[];assert.equal(appendTerrainAccents(repeated,tiles,cube),count);
 assert.deepEqual(repeated,out);
 assert.equal(terrainAccent({x:1,y:1,terrain:"unknown"}),null);
 const hidden=tiles.map(tile=>({...tile,terrain:"unknown"}));
 assert.equal(appendTerrainAccents([],hidden,cube),0);
 assert.equal(appendTerrainAccents([],tiles,cube,0),0);
 assert.throws(()=>appendTerrainAccents([],tiles,cube,ENVIRONMENT_DETAILS_CAP+1),/Invalid/);
 assert.throws(()=>terrainAccent({x:1.5,y:2,terrain:"grass"}),/Invalid/);
});
