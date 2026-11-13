import test from "node:test";
import assert from "node:assert/strict";
import {mkdtemp,readFile,readdir,rm,writeFile,stat} from "node:fs/promises";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {MatchHost} from "../src/network.js";
import {checksum} from "../src/simulation.js";
import {guardCheckpointStartup,readHostCheckpoint,writeHostCheckpoint} from "../src/hostStore.js";
const players=[{id:"alpha",faction:"Humans"},{id:"beta",faction:"Orcs"}];
test("host checkpoint disk roundtrip resumes authoritative versions and rotates credentials",async()=>{
 const dir=await mkdtemp(join(tmpdir(),"crowns-test-")),file=join(dir,"store.json");
 try{
  const h=new MatchHost(players,88),before=h.credentialsFor("alpha").token;
  h.submit({token:before,sequence:1,action:"allocate",payload:{workers:{Wood:3}}});
  h.advance(1000);
  const saved=await writeHostCheckpoint(h,file);
  assert.equal(saved.version,h.version);
  const bytes=await readFile(file,"utf8");
  assert.ok(!bytes.includes(before));
  const restored=await readHostCheckpoint(file);
  assert.equal(checksum(restored.match),checksum(h.match));
  assert.equal(restored.version,h.version);
  const token=restored.credentialsFor("alpha").token;
  assert.notEqual(token,before);
  assert.throws(()=>restored.view(before),/Unauthorized/);
  assert.equal(restored.submit({token,sequence:2,action:"allocate",
   payload:{workers:{Food:3}}}).accepted,true);
  const leftovers=(await readdir(dir)).filter(x=>x.includes(".tmp-"));
  assert.deepEqual(leftovers,[]);
  if(process.platform!=="win32")
   assert.equal((await stat(file)).mode&0o777,0o600);
 }finally{await rm(dir,{recursive:true,force:true});}
});
test("checkpoint replace is atomic at file level; corrupted input rejected",async()=>{
 const dir=await mkdtemp(join(tmpdir(),"crowns-test-")),file=join(dir,"store.json");
 try{
  const h=new MatchHost(players,9,{requireReady:true}),a=h.credentialsFor("alpha").token;
  await writeHostCheckpoint(h,file);
  h.setReady(a,true);
  await writeHostCheckpoint(h,file);
  const restored=await readHostCheckpoint(file);
  assert.equal(restored.lobbyState(restored.credentialsFor("alpha").token).players[0].ready,true);
  await writeFile(file,'{"forged":true}',"utf8");
  await assert.rejects(readHostCheckpoint(file),/integrity|Unsupported|checkpoint/);
 }finally{await rm(dir,{recursive:true,force:true});}
});

test("checkpoint bootstrap refuses silent overwrite and requires explicit restore/reset",async()=>{
 const dir=await mkdtemp(join(tmpdir(),"crowns-startup-")),file=join(dir,"save.json");
 try{
  assert.deepEqual(await guardCheckpointStartup(file),{
   exists:false,restore:false,reset:false});
  await writeHostCheckpoint(new MatchHost(players,20),file);
  await assert.rejects(guardCheckpointStartup(file),/would be overwritten/);
  await assert.rejects(guardCheckpointStartup(file,{restore:true,reset:true}),
   /Cannot restore and reset/);
  assert.equal((await guardCheckpointStartup(file,{restore:true})).exists,true);
  assert.equal((await guardCheckpointStartup(file,{reset:true})).exists,true);
  await assert.rejects(guardCheckpointStartup(join(dir,"absent.json"),{restore:true}),
   /does not exist/);
 }finally{await rm(dir,{recursive:true,force:true});}
});
