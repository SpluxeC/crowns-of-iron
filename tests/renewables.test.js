import test from "node:test";
import assert from "node:assert/strict";
import {createMatch} from "../src/simulation.js";
import {tickRenewables} from "../src/renewableEconomy.js";
import {applyStatus,tickStatuses} from "../src/combat.js";

function setup(spatial=true){
 const m=createMatch([{id:"a",faction:"Humans"},{id:"b",faction:"Orcs"}]);
 if(spatial)m.economyMode="spatial";
 m.constructions={farm:{siteId:"farm",owner:"a",kind:"Farm",completed:true},
 forester:{siteId:"forester",owner:"a",kind:"Forester",completed:true},
 aether:{siteId:"aether",owner:"a",kind:"Aether Condenser",completed:true}};
 return {m,p:m.players[0]};
}
test("renewable producers work in spatial mode only and accrue fractional output",()=>{
 const {m,p}=setup(),before={...p.resources};
 for(let n=0;n<10;n++)tickRenewables(m,1000);
 assert.equal(p.resources.Food-before.Food,20);
 assert.equal(p.resources.Wood-before.Wood,16);
 assert.equal(p.resources.Aether-before.Aether,3);
 const baseline=setup(false),original=baseline.p.resources.Food;
 tickRenewables(baseline.m,20000);
 assert.equal(baseline.p.resources.Food,original);
});
test("farm and Aether research increases renewable production additively",()=>{
 const {m,p}=setup();p.completed.push("ECO-05","ECO-06","ECO-07","SPC-10","FAC-13");
 const before={...p.resources};
 tickRenewables(m,100000);
 assert.equal(p.resources.Food-before.Food,240);
 assert.equal(p.resources.Wood-before.Wood,176);
 assert.equal(p.resources.Aether-before.Aether,34);
});
test("Corruption mitigation reduces status damage without regenerating health",()=>{
 const {p}=setup();const unit=p.units[0],base=unit.hp;
 p.completed.push("SPC-05");
 applyStatus(unit,"Corruption",1000,10);
 tickStatuses(p,1000);
 assert.equal(base-unit.hp,9);
 tickStatuses(p,1000);
 assert.equal(base-unit.hp,9);
});
