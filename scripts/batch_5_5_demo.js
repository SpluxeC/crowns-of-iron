import {mkdtemp,rm} from "node:fs/promises";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {MatchHost} from "../src/network.js";
import {writeHostCheckpoint,readHostCheckpoint,guardCheckpointStartup} from "../src/hostStore.js";
import {nextMandatoryResearch,availableBuildings,eligibleTrainingSites} from "../web/clientRules.js";
import {createVersionDecoder} from "../web/streamProtocol.js";
import {assert} from "../src/util.js";
const people=[{id:"a",faction:"Humans"},{id:"b",faction:"Orcs"}],host=new MatchHost(people,77);
const token=host.credentialsFor("a").token,p=host.match.players[0];
assert(nextMandatoryResearch(p)?.id==="CIV-01");
assert(availableBuildings(p).some(b=>b.kind==="Training Camp"));
assert(eligibleTrainingSites(p).some(c=>c.role==="Worker"));
host.submit({token,sequence:1,action:"research",
 payload:{facility:"Town Center",id:"CIV-01"}});
assert(p.researchQueues["Town Center"].length===1);
const nl=String.fromCharCode(10);
const parsed=createVersionDecoder().push(["event: version",'data: {"version":2}',"",""].join(nl));
assert(parsed[0]===2,"SSE decoding failed");
const dir=await mkdtemp(join(tmpdir(),"crowns-phase-")),path=join(dir,"checkpoint.json");
try{
 await writeHostCheckpoint(host,path);
 let refusedOverwrite=false;
 try{await guardCheckpointStartup(path);}catch(e){
  refusedOverwrite=/overwritten/.test(e.message);
 }
 assert(refusedOverwrite,"Existing save overwrite was not prevented");
 const resumed=await readHostCheckpoint(path);
 assert(resumed.version===host.version);
 assert(resumed.credentialsFor("a").token!==token);
 console.log(JSON.stringify({phase:"5.5–5.8",researchQueued:true,buildUi:true,
  localRestore:true,newTokens:true,streamParser:true,browserVisualQA:"manual"},null,2));
}finally{await rm(dir,{recursive:true,force:true});}
