import {createServer} from "node:http";
import {MatchHost} from "../src/network.js";
import {assert} from "../src/util.js";
const host=new MatchHost([{id:"human",faction:"Humans"},{id:"orc",faction:"Orcs"}],2026);
const bindAddress="127.0.0.1",port=Number(process.env.PORT||5190);
const access=host.credentialsFor("human");
const maxBodyBytes=16000;
function send(res,status,obj){
  res.writeHead(status,{"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store",
    "X-Content-Type-Options":"nosniff"});
  res.end(JSON.stringify(obj));
}
async function requestBody(req){
  const parts=[];let total=0;
  for await(const chunk of req){total+=chunk.length;assert(total<=maxBodyBytes,"Request too large");parts.push(chunk);}
  return JSON.parse(Buffer.concat(parts).toString("utf8")||"{}");
}
const server=createServer(async(req,res)=>{
  try{
    const u=new URL(req.url,"http://"+bindAddress);
    const token=req.headers["x-session-token"];
    if(u.pathname==="/health"&&req.method==="GET")return send(res,200,{status:"ok",prototype:true});
    if(u.pathname==="/state"&&req.method==="GET")return send(res,200,host.view(token));
    if(u.pathname==="/command"&&req.method==="POST")return send(res,200,host.submit({token,...await requestBody(req)}));
    // No player-controlled time advancement. Prototype server advances on its own timer.
    return send(res,404,{error:"Unknown endpoint"});
  }catch(e){return send(res,400,{error:e.message});}
});
const timer=setInterval(()=>host.advance(1000),1000);
server.on("close",()=>clearInterval(timer));
server.listen(port,bindAddress,()=>{
  console.log("Local-only RTS protocol server at http://"+bindAddress+":"+port);
  console.log("Human session token (DEV ONLY, do not share): "+access.token);
  console.log("This development server has no fog-of-war filtering or public auth.");
});
