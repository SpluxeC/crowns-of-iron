import test from "node:test";
import assert from "node:assert/strict";
import {CORE_RESEARCH,availableBuildings,chooseBuilder,nextMandatoryResearch,
 eligibleTrainingSites,queueSummary} from "../web/clientRules.js";
test("mandatory UI research respects age, dependencies, already queued and completed",()=>{
 assert.equal(CORE_RESEARCH.length,12);
 const p={age:"I",completed:[],researchQueues:{"Town Center":[]}};
 assert.equal(nextMandatoryResearch(p).id,"CIV-01");
 p.researchQueues["Town Center"]=[{id:"CIV-01",ms:0}];
 assert.equal(nextMandatoryResearch(p),null);
 p.researchQueues["Town Center"]=[];
 p.completed.push("CIV-01");
 assert.equal(nextMandatoryResearch(p).id,"CIV-02");
 p.completed.push("CIV-02","CIV-03");p.age="II";
 assert.equal(nextMandatoryResearch(p).id,"CIV-04");
 p.completed.push("CIV-04");
 assert.equal(nextMandatoryResearch(p).id,"CIV-05");
});
test("construction worker must be alive, selected, placed and not embarked",()=>{
 const p={units:[{id:"worker",archetype:"Worker",alive:true,x:3,y:4},
  {id:"scout",archetype:"Scout",alive:true,x:4,y:4}]};
 assert.equal(chooseBuilder(p,["worker"]).id,"worker");
 assert.equal(chooseBuilder(p,["scout"]),null);
 p.units[0].embarkedAt="boat";
 assert.equal(chooseBuilder(p,["worker"]),null);
});
test("age-based buildings, training queues and research summary remain private to player",()=>{
 const p={age:"I",unitQueues:{"Town Center":[],
   "Training Camp#2":[{role:"Club Fighter",ms:12000}]},
   researchQueues:{"Town Center":[{id:"CIV-01",ms:500}]}};
 assert.deepEqual(availableBuildings(p).map(x=>x.kind),
  ["Training Camp","Shelter","Resource Depot"]);
 assert.ok(eligibleTrainingSites(p).some(x=>x.role==="Club Fighter"));
 assert.equal(queueSummary(p).length,2);
 p.age="II";assert.ok(availableBuildings(p).some(x=>x.kind==="Barracks"));
});
