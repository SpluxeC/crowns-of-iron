import test from "node:test";
import assert from "node:assert/strict";
import {createMatch,command,step} from "../src/simulation.js";
import {makeMap,placeBuilding} from "../src/map.js";
import {attachBattlefield} from "../src/battlefield.js";
import {makeUnit} from "../src/state.js";
import {ARCHETYPES} from "../src/catalog.js";
import {embark} from "../src/transports.js";
function fixture(){
 const m=createMatch([{id:"a",faction:"Humans"},{id:"b",faction:"Orcs"}],23);
 const map=makeMap({seed:23,players:2});
 for(const t of map.tiles){t.terrain="grass";t.occupied=null;t.resource=null;t.amount=0;}
 attachBattlefield(m,map);
 const loc=placeBuilding(map,{owner:"b",kind:"Stone Gatehouse",x:12,y:10,width:2,height:2});
 m.constructions={[loc.id]:{siteId:loc.id,owner:"b",kind:"Stone Gatehouse",completed:true,
  hp:1600,maxHp:1600,armor:10,garrisonIds:[]}};
 const p=m.players[0],defender=m.players[1];
 const tower=makeUnit(p,"Siege Tower",ARCHETYPES["Siege Tower"],"tower");
 tower.x=11;tower.y=10;p.units.push(tower);p.popUsed+=tower.pop;
 const attacker=makeUnit(p,"Swordsman",ARCHETYPES.Swordsman,"tower-infantry");
 attacker.x=10;attacker.y=10;p.units.push(attacker);p.popUsed+=attacker.pop;
 const guard=makeUnit(defender,"Archer",ARCHETYPES.Archer,"guard");
 guard.x=12;guard.y=9;defender.units.push(guard);defender.popUsed+=guard.pop;
 command(m,{player:"b",action:"garrison",siteId:loc.id,unitId:guard.id});
 return {m,p,tower,attacker,guard,loc};
}
test("siege towers can board infantry up to eight passenger population",()=>{
 const {m,tower,attacker}=fixture();
 const board=embark(m,"a",tower.id,attacker.id);
 assert.equal(board.occupied,1);
 assert.equal(tower.passengerCapacity,8);
 assert.equal(attacker.embarkedAt,tower.id);
});
test("ramp needs a five-second deployment before infantry can attack battlements",()=>{
 const {m,tower,attacker,guard,loc}=fixture();
 embark(m,"a",tower.id,attacker.id);
 command(m,{player:"a",action:"deployRamp",towerId:tower.id,siteId:loc.id});
 assert.throws(()=>command(m,{player:"a",action:"assaultBattlement",
  towerId:tower.id,attackerId:attacker.id,targetId:guard.id}),/not deployed/);
 step(m,5000);
 const hp=guard.hp;
 const result=command(m,{player:"a",action:"assaultBattlement",
  towerId:tower.id,attackerId:attacker.id,targetId:guard.id});
 assert.ok(result.damage>0);assert.ok(guard.hp<hp);
 assert.throws(()=>command(m,{player:"a",action:"assaultBattlement",
  towerId:tower.id,attackerId:attacker.id,targetId:guard.id}),/cooldown/);
});
test("tower ramp is invalidated when the tower moves away",()=>{
 const {m,tower,attacker,guard,loc}=fixture();
 embark(m,"a",tower.id,attacker.id);
 command(m,{player:"a",action:"deployRamp",towerId:tower.id,siteId:loc.id});
 tower.x=5;tower.y=5;
 step(m,1000);
 assert.equal(tower.rampSiteId,null);
});
