import {createServer} from "node:http";
import {readFile} from "node:fs/promises";
import {assert} from "./util.js";

// Same-origin loopback development transport. Never publicly bind this server.
const STATIC={
 "/client":["../web/netplay.html","text/html; charset=utf-8"],
 "/netplay.js":["../web/netplay.js","text/javascript; charset=utf-8"],
 "/webgl3d.js":["../web/webgl3d.js","text/javascript; charset=utf-8"],
 "/clientRules.js":["../web/clientRules.js","text/javascript; charset=utf-8"]
};
const HEADERS={"Cache-Control":"no-store","X-Content-Type-Options":"nosniff",
 "Referrer-Policy":"no-referrer",
 "Content-Security-Policy":"default-src 'none'; script-src 'self'; connect-src 'self'; style-src 'unsafe-inline'; img-src 'self' data:; base-uri 'none'; frame-ancestors 'none'"};
function send(res,code,data){
 res.writeHead(code,{"Content-Type":"application/json; charset=utf-8",...HEADERS});
 res.end(JSON.stringify(data));
}
async function readBody(req){
 const parts=[];let total=0;
 for await(const part of req){
  total+=part.length;assert(total<=16000,"Request too large");parts.push(part);
 }
 return JSON.parse(Buffer.concat(parts).toString("utf8")||"{}");
}
/** Build a transport around the existing authoritative host without exporting secrets. */
export function createLoopbackProtocolServer(host){
 const clients=new Set();
 function publish(){
  for(const client of [...clients]){
   if(client.res.destroyed||!host.sessions.has(client.token)){
    client.close();client.res.end();continue;
   }
   if(client.res.writableLength>32768){
    client.close();client.res.destroy();continue;
   }
   if(client.version!==host.version){
    client.version=host.version;
    client.res.write("event: version\ndata: "+JSON.stringify({version:host.version})+"\n\n");
   }
  }
 }
 const server=createServer(async(req,res)=>{
  try{
   const u=new URL(req.url,"http://127.0.0.1"),path=u.pathname;
   const token=req.headers["x-session-token"];
   if(req.method==="GET"&&STATIC[path]){
    const [relative,mime]=STATIC[path];
    const bytes=await readFile(new URL(relative,import.meta.url));
    res.writeHead(200,{"Content-Type":mime,...HEADERS});
    return res.end(bytes);
   }
   if(path==="/health"&&req.method==="GET")
    return send(res,200,{status:"ok",prototype:true,transport:"loopback-sse"});
   if(path==="/events"&&req.method==="GET"){
    // Auth uses a request header, never a token in a URL. Stream only versions.
    host.lobbyState(token);
    assert(clients.size<16,"Stream capacity reached");
    res.writeHead(200,{"Content-Type":"text/event-stream; charset=utf-8",
      "Connection":"keep-alive",...HEADERS});
    let timer;
    const client={token,res,version:host.version,close(){
      clients.delete(client);clearInterval(timer);
    }};
    clients.add(client);
    res.write("retry: 1500\nevent: version\ndata: "+
      JSON.stringify({version:host.version})+"\n\n");
    timer=setInterval(()=>{
      if(res.destroyed)client.close();
      else if(res.writableLength>32768){client.close();res.destroy();}
      else res.write(": heartbeat\n\n");
    },15000);
    res.on("close",client.close);
    return;
   }
   if(path==="/state"&&req.method==="GET")return send(res,200,host.view(token));
   if(path==="/lobby"&&req.method==="GET")return send(res,200,host.lobbyState(token));
   if(path==="/resync"&&req.method==="GET")
    return send(res,200,host.resync({token,
      afterVersion:Number(u.searchParams.get("afterVersion")??0)}));
   if(path==="/command"&&req.method==="POST"){
    const input=await readBody(req),result=host.submit({token,...input});
    publish();return send(res,200,result);
   }
   if(path==="/command-batch"&&req.method==="POST"){
    const input=await readBody(req),result=host.submitBatch({token,...input});
    publish();return send(res,200,result);
   }
   if(path==="/lobby/ready"&&req.method==="POST"){
    const input=await readBody(req),result=host.setReady(token,input.ready);
    publish();return send(res,200,result);
   }
   if(path==="/lobby/start"&&req.method==="POST"){
    await readBody(req);const result=host.startMatch(token);
    publish();return send(res,200,result);
   }
   if(path==="/session/rotate"&&req.method==="POST"){
    await readBody(req);const result=host.rotateToken(token);
    publish();return send(res,200,result);
   }
   return send(res,404,{error:"Unknown endpoint"});
  }catch(e){
   const status=/Unauthorized session/.test(e.message)?401:
     /Stream capacity/.test(e.message)?429:400;
   if(!res.headersSent)send(res,status,{error:e.message});
   else res.end();
  }
 });
 server.on("close",()=>{
  for(const c of [...clients]){c.close();c.res.end();}
 });
 return {server,publish,subscriberCount:()=>clients.size};
}
