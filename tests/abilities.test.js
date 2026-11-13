import test from "node:test";
import assert from "node:assert/strict";
import {createMatch,command,step} from "../src/simulation.js";
import {attachBattlefield} from "../src/battlefield.js";
import {makeMap} from "../src/map.js";
import {makeUnit} from "../src/state.js";
import {ARCHETYPES} from "../src/catalog.js";
import {HERO_ABILITIES,getEffectiveStats} from "../src/abilities.js";
import {FACTIONS} from "../src/constants.js";
function setup(faction){
 const m=createMatch([{id:"a",faction},{id:"b",faction:"Orcs"===faction?"Humans":"Orcs"}]);
 attachBattlefield(m,makeMap({players:2}));
 const p=m.players[0],enemy=m.players[1],hero=makeUnit(p,"Hero",ARCHETYPES.Hero,"faction-hero");
 hero.x=p.units[0].x;hero.y=p.units[0].y;
 p.units.push(hero);p.popUsed+=6;
 enemy.units[0].x=hero.x+1;enemy.units[0].y=hero.y;
 return {m,p,hero,enemy};
}
test("all six hero abilities have distinct named passives and actives",()=>{
 assert.equal(Object.keys(HERO_ABILITIES).length,6);
 for(const f of FACTIONS){assert.ok(HERO_ABILITIES[f].active);assert.ok(HERO_ABILITIES[f].passive);}
 assert.equal(new Set(FACTIONS.map(x=>HERO_ABILITIES[x].active)).size,6);
});
test("human rally provides temporary attack buff and respects cooldown",()=>{
 const {m,hero}=setup("Humans");
 const result=command(m,{player:"a",action:"ability",heroId:hero.id});
 assert.equal(result.name,"Rally the Crown");
 assert.ok(getEffectiveStats(hero,0).attack>hero.attack);
 assert.throws(()=>command(m,{player:"a",action:"ability",heroId:hero.id}),/cooldown/);
 for(let i=0;i<1;i++)step(m,13000);
 assert.equal(getEffectiveStats(hero,m.elapsedMs).attack,hero.attack);
});
test("Dwarf bulwark boosts armor without passive healing",()=>{
 const {m,hero}=setup("Dwarfs");
 hero.hp=100;
 command(m,{player:"a",action:"ability",heroId:hero.id});
 assert.equal(getEffectiveStats(hero,0).armor,hero.armor+6);
 step(m,16000);
 assert.equal(hero.hp,100);
 assert.equal(getEffectiveStats(hero,m.elapsedMs).armor,hero.armor);
});
test("Tree Elf, Corrupt Elf and Ursa offensives affect enemy units",()=>{
 for(const faction of ["Tree Elves","Corrupt Elves","Ursa"]){
  const {m,hero,enemy}=setup(faction),before=enemy.units[0].hp;
  const result=command(m,{player:"a",action:"ability",heroId:hero.id,point:{x:hero.x+1,y:hero.y}});
  assert.equal(result.affected,1);
  assert.ok(enemy.units[0].hp<before);
 }
});
