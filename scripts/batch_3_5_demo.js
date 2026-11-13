import {readFileSync} from "node:fs";
import {createMatch,step,checksum} from "../src/simulation.js";
import {makeIslandMap} from "../src/islandMaps.js";
import {verifySeaConnectivity} from "../src/coastal.js";
import {attachBattlefield} from "../src/battlefield.js";
import {installFullCatalog} from "../src/fullCatalog.js";
import {setEconomyMode} from "../src/spatialEconomy.js";
import {enableBot} from "../src/ai.js";
import {executableCoverage} from "../src/technologyEffects.js";
import {MatchHost} from "../src/network.js";
const players=[{id:"humans",faction:"Humans"},{id:"ursa",faction:"Ursa"}];
const data=JSON.parse(readFileSync("data/balance-v0.2.json","utf8"));
const match=createMatch(players,86);
installFullCatalog(match,data);
const map=makeIslandMap({seed:86,width:64,height:64,players:2});
const sea=verifySeaConnectivity(map);
if(!sea.connected||map.fishShoals.length!==3)throw Error("Island naval map is invalid");
attachBattlefield(match,map);setEconomyMode(match,"spatial");enableBot(match,"ursa","Hard");
for(let i=0;i<30;i++)step(match,1000);
const coverage=executableCoverage(Object.keys(match.fullCatalog.techs.Humans));
if(coverage.implemented!==78||coverage.pending!==0)throw Error("Incorrect research coverage");
const host=new MatchHost(players,86),session=host.credentialsFor("humans");
host.advance(1000);
const resync=host.resync({token:session.token,afterVersion:0});
if(resync.version!==1||resync.state.players[1].resources!==undefined)
  throw Error("Snapshot versioning or privacy regression");
const rotated=host.rotateToken(session.token);
let oldTokenDenied=false;
try{host.resync({token:session.token,afterVersion:0});}catch{oldTokenDenied=true;}
if(!oldTokenDenied)throw Error("Old reconnect token remains valid");
console.log(JSON.stringify({milestones:"3.5–3.8",connectedSea:sea.connected,
 seaTiles:sea.total,islandObjectives:map.navalObjectives.length,
 fishShoals:map.fishShoals.length,typedOptionalTechnologyEffects:coverage.implemented,
 pendingOptionalTechnologyEffects:coverage.pending,
 reconnectTokenRotated:rotated.token!==session.token,
 localResyncVersion:resync.version,checksum:checksum(match),
 caveat:"Headless prototype; no client-side 3D, full naval simulation or public networking"},null,2));
