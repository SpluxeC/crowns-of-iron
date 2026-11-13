import {runLocalHttpBenchmark} from "../src/localHttpBenchmark.js";
const result=await runLocalHttpBenchmark({players:8,rounds:12,seed:707});
console.log(JSON.stringify({milestone:"7.0",...result},null,2));
