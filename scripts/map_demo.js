import {makeMap,asciiMap,nearbyResources,findPath} from "../src/map.js";
const m=makeMap({width:40,height:32,seed:421,players:4});
console.log(asciiMap(m));
console.log("\nStarting resources:");
for(const start of m.starts)console.log(start.player+1,nearbyResources(m,start));
console.log("Example path distance:",findPath(m,m.starts[0],m.starts[2])?.length??"blocked");
