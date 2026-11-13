import {assert} from "./util.js";
export function makeRng(seed=1){
  assert(Number.isSafeInteger(seed),"Seed must be an integer");
  let state=seed>>>0;
  return {
    next(){state=(Math.imul(1664525,state)+1013904223)>>>0;return state/4294967296;},
    int(max){assert(Number.isSafeInteger(max)&&max>0,"Invalid RNG bound");return Math.floor(this.next()*max);},
    state(){return state;}
  };
}
