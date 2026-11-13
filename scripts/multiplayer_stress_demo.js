import {runLocalHostStress} from "../src/networkDiagnostics.js";
const start=performance.now();
const outcome=runLocalHostStress({players:8,population:300,ticks:3,seed:20261113});
console.log(JSON.stringify({...outcome,elapsedWallMs:Math.round(performance.now()-start),
 caveat:"Local in-process simulation/snapshot stress only; NOT real Internet networking, 3D rendering, client latency or network security testing"},null,2));
