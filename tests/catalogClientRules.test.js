import test from "node:test";
import assert from "node:assert/strict";
import {catalogBuildings,catalogTraining,catalogResearch,researchRequest,trainingRequest,formatCost} from "../web/clientRules.js";
const catalog={buildings:[{kind:"Shelter",ageUnlocked:true},{kind:"Barracks",ageUnlocked:false}],
 training:[{facility:"Town Center",role:"Worker",ageUnlocked:true,available:true},
 {facility:"Barracks#1",role:"Swordsman",ageUnlocked:false,available:false}],
 research:[{id:"CIV-01",available:true,facility:"Town Center",ageUnlocked:true},
 {id:"CIV-02",available:false,queued:true,ageUnlocked:true},
 {id:"CIV-03",available:false,completed:true,ageUnlocked:true}]};
test("authoritative UI catalog selectors never fabricate unlocks",()=>{
 assert.deepEqual(catalogBuildings(catalog).map(c=>c.kind),["Shelter"]);
 assert.deepEqual(catalogTraining(catalog).map(c=>c.role),["Worker"]);
 assert.deepEqual(catalogResearch(catalog).map(t=>t.id),["CIV-01"]);
 assert.deepEqual(catalogResearch(catalog,"queued").map(t=>t.id),["CIV-02"]);
 assert.deepEqual(catalogResearch(catalog,"completed").map(t=>t.id),["CIV-03"]);
 assert.equal(catalogResearch(catalog,"all").length,3);
 assert.deepEqual(researchRequest(catalog,"CIV-01"),{facility:"Town Center",id:"CIV-01"});
 assert.equal(researchRequest(catalog,"CIV-02"),null);
 assert.deepEqual(trainingRequest(catalog,"Town Center","Worker"),{
  facility:"Town Center",role:"Worker"});
 assert.equal(trainingRequest(catalog,"Barracks#1","Swordsman"),null);
 assert.equal(trainingRequest(catalog,"Town Center","Admin"),null);
 assert.equal(formatCost({Wood:100,Stone:40}),"100 Wood, 40 Stone");
});
