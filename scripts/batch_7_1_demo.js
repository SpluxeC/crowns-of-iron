import {runBrowserDeliverySmoke} from "../src/browserDeliverySmoke.js";
import {runLargeArmyMovementProfile} from "../src/largeArmyMovementProfile.js";
import {validateAssetRegistry} from "../web/assetManifest.js";
import {MatchHost} from "../src/network.js";
import {assert} from "../src/util.js";
const delivery=await runBrowserDeliverySmoke();
const assets=validateAssetRegistry();
const profile=runLargeArmyMovementProfile({seed:730,ticks:2});
assert(delivery.authenticatedBatch&&delivery.anonymousRejected);
assert(assets.unitFamilies===7&&assets.buildingFamilies===3);
assert(profile.totalUnits===2400&&profile.issuedAttackMoveOrders===64&&profile.overlaps===0);
const host=new MatchHost([{id:"a",faction:"Humans"},{id:"b",faction:"Orcs"}],735);
const attacker=host.match.players[0].units.find(u=>u.attack>0),token=host.credentialsFor("a").token;
host.submit({token,sequence:1,action:"stance",
 payload:{unitId:attacker.id,stance:"guard"}});
host.submit({token,sequence:2,action:"attackMove",
 payload:{unitId:attacker.id,x:attacker.x,y:attacker.y}});
assert(host.match.orders[attacker.id].kind==="attackMove");
console.log(JSON.stringify({milestones:"7.1–7.4",assets,delivery,profile,
 caveat:"Node headless and loopback HTTP checks; real browser visuals, simultaneous 2400-unit navigation and WAN untested"},null,2));
