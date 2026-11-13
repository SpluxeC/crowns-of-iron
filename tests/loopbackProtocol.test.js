import test from "node:test";
import assert from "node:assert/strict";
import {MatchHost} from "../src/network.js";
import {createLoopbackProtocolServer} from "../src/loopbackProtocol.js";
async function setup(){
 const host=new MatchHost([{id:"a",faction:"Humans"},{id:"b",faction:"Orcs"}],
  91,{requireReady:true});
 const a=host.credentialsFor("a").token,b=host.credentialsFor("b").token;
 const protocol=createLoopbackProtocolServer(host);
 await new Promise(resolve=>protocol.server.listen(0,"127.0.0.1",resolve));
 const base="http://127.0.0.1:"+protocol.server.address().port;
 const call=async(path,token,method="GET",body)=>{
  const r=await fetch(base+path,{method,headers:{
   "x-session-token":token,"Content-Type":"application/json"},
   body:method==="GET"?undefined:JSON.stringify(body??{})});
  return {status:r.status,data:await r.json()};
 };
 const stop=async()=>{
  protocol.server.closeAllConnections();
  await new Promise(resolve=>protocol.server.close(resolve));
 };
 return {host,a,b,protocol,base,call,stop};
}
test("same-origin local HTTP protocol authenticates client and authorizes lobby launch",async()=>{
 const f=await setup();
 try{
  assert.equal((await f.call("/state","bad-token")).status,401);
  assert.equal((await f.call("/lobby",f.a)).data.started,false);
  assert.equal((await f.call("/lobby/ready",f.a,"POST",{ready:true})).status,200);
  assert.equal((await f.call("/lobby/start",f.a,"POST")).status,400);
  assert.equal((await f.call("/lobby/ready",f.b,"POST",{ready:true})).status,200);
  assert.equal((await f.call("/lobby/start",f.a,"POST")).status,200);
  const sent=await f.call("/command",f.a,"POST",{
   sequence:1,action:"allocate",payload:{workers:{Food:3}}});
  assert.equal(sent.status,200);
  assert.equal((await f.call("/state",f.a)).data.nextSequence,2);
  const other=(await f.call("/state",f.b)).data;
  assert.equal(other.state.players[0].resources,undefined);
  assert.ok(!JSON.stringify(other).includes(f.a));
 }finally{await f.stop();}
});
test("authenticated SSE streams version changes but no private state or tokens",async()=>{
 const f=await setup(),control=new AbortController();
 const timeout=setTimeout(()=>control.abort(),6000);
 try{
  const bad=await fetch(f.base+"/events");
  assert.equal(bad.status,401);
  const res=await fetch(f.base+"/events",{
   headers:{"x-session-token":f.a},signal:control.signal});
  assert.equal(res.status,200);
  assert.match(res.headers.get("content-type"),/text\/event-stream/);
  const reader=res.body.getReader(),decode=new TextDecoder();
  const first=decode.decode((await reader.read()).value);
  assert.match(first,/event: version/);
  assert.match(first,/"version":0/);
  await f.call("/lobby/ready",f.b,"POST",{ready:true});
  const next=decode.decode((await reader.read()).value);
  assert.match(next,/"version":1/);
  assert.ok(!next.includes(f.a)&&!next.includes(f.b));
  assert.equal(f.protocol.subscriberCount(),1);
  await reader.cancel();
 }finally{
  clearTimeout(timeout);control.abort();await f.stop();
 }
});
test("browser assets served with restrictive CSP and no public filesystem access",async()=>{
 const f=await setup();
 try{
  const page=await fetch(f.base+"/client");
  assert.equal(page.status,200);
  assert.match(await page.text(),/Crowns of Iron/);
  assert.match(page.headers.get("content-security-policy"),/script-src/);
  const script=await fetch(f.base+"/netplay.js");
  assert.equal(script.status,200);
  assert.match(await script.text(),/x-session-token/);
  assert.equal((await f.call("/package.json",f.a)).status,404);
 }finally{await f.stop();}
});
