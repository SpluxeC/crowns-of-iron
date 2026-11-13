import {MatchHost} from "../src/network.js";
import {createLoopbackProtocolServer} from "../src/loopbackProtocol.js";

// Deliberately loopback-only: credentials are developer test secrets, not accounts.
const host=new MatchHost([{id:"human",faction:"Humans"},
 {id:"orc",faction:"Orcs"}],2026,{requireReady:process.env.REQUIRE_READY==="1"});
const {server,publish}=createLoopbackProtocolServer(host);
const port=Number(process.env.PORT||5190);
const timer=setInterval(()=>{
 if(host.lobby.started){host.advance(1000);publish();}
},1000);
server.on("close",()=>clearInterval(timer));
server.listen(port,"127.0.0.1",()=>{
 console.log("Crowns of Iron local multiplayer browser: http://127.0.0.1:"+port+"/client");
 console.log("DEV ONLY: distribute each test session token privately, never expose publicly.");
 for(const p of host.match.players)console.log(p.id+": "+host.credentialsFor(p.id).token);
 console.log("Optional lobby: run with REQUIRE_READY=1. No production TLS, accounts or matchmaking.");
});
