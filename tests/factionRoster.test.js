import test from "node:test";
import assert from "node:assert/strict";
import {FACTIONS} from "../src/constants.js";
import {CANONICAL_NAMES,ROLE_ORDER,validateCanonicalRoster,canonicalName,FACTION_STAT_MODIFIERS} from "../src/factionRoster.js";
import {createMatch} from "../src/simulation.js";
import {makeUnit} from "../src/state.js";
import {ARCHETYPES} from "../src/catalog.js";
test("all six factions have their actual 36 canonical unit names",()=>{
 assert.deepEqual(validateCanonicalRoster(),{factions:6,land:132,naval:48,air:36,total:216});
 for(const faction of FACTIONS){
  assert.equal(CANONICAL_NAMES[faction].length,36);
  assert.ok(ROLE_ORDER.every(role=>canonicalName(faction,role)));
  assert.equal(CANONICAL_NAMES[faction].length,new Set(CANONICAL_NAMES[faction]).size);
 }
 assert.equal(canonicalName("Humans","Hero"),"Lord Aldren");
 assert.equal(canonicalName("Ursa","Legendary Warship"),"Great Ursaship");
});
test("balanced faction modifiers are applied without changing hero baseline",()=>{
 const m=createMatch([{id:"a",faction:"Dwarfs"},{id:"b",faction:"Tree Elves"}]);
 const dwarf=m.players[0],elf=m.players[1];
 const warrior=makeUnit(dwarf,"Swordsman",ARCHETYPES.Swordsman,"dwarf-sword");
 assert.equal(warrior.maxHp,Math.round(120*FACTION_STAT_MODIFIERS.Dwarfs.hp));
 assert.equal(warrior.armor,6);
 assert.equal(warrior.name,"Axe Guard");
 assert.ok(makeUnit(elf,"Archer",ARCHETYPES.Archer,"tree-archer").speedScale>1);
 const hero=makeUnit(dwarf,"Hero",ARCHETYPES.Hero,"dwarf-hero");
 assert.equal(hero.maxHp,850);
 assert.equal(hero.attack,38);
});
test("all initial unit IDs are globally unique across eight players",()=>{
 const faction=FACTIONS;
 const m=createMatch(Array.from({length:8},(_,i)=>({id:"p"+i,faction:faction[i%6]})));
 const ids=m.players.flatMap(p=>p.units.map(u=>u.id));
 assert.equal(new Set(ids).size,ids.length);
});
