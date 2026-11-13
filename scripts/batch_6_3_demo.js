import {runArmyRehearsal} from "../src/armyRehearsal.js";
import {terrainSignature,cameraForMap,projectWorld} from "../web/webgl3d.js";
import {unitsInTileRectangle,makeFormationPayload} from "../web/unitSelection.js";
import {assert} from "../src/util.js";

const start=performance.now();
const report=runArmyRehearsal({seed:260,ticks:4,squads:2});
const elapsedMs=Math.round(performance.now()-start);
assert(report.formationUnits===384&&report.liveUnits===416);
assert(report.overlaps===0&&report.version===20);
const world={width:2,height:2,tiles:[
 {x:0,y:0,terrain:"grass"},{x:1,y:0,terrain:"hill"},
 {x:0,y:1,terrain:"water"},{x:1,y:1,terrain:"grass"}]};
const checksum=terrainSignature(world);
const camera=cameraForMap(40,32),projected=projectWorld({x:20,y:0,z:16},800,640,camera);
assert(checksum&&projected&&projected.depth>0);
const selected=unitsInTileRectangle({units:[
 {id:"a",x:1,y:1,alive:true,archetype:"Swordsman"},
 {id:"b",x:2,y:2,alive:true,archetype:"Worker"}]},
 {x:0,y:0},{x:3,y:3});
assert(makeFormationPayload(selected,5,5).units.length===2);
console.log(JSON.stringify({milestones:"6.3–6.6",report,elapsedWallMs:elapsedMs,
 caveat:"In-process Node simulation, fake-GPU tests and pure browser helpers only; actual browser visuals, Internet latency and full-population active navigation untested"},null,2));
