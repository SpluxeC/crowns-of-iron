import { RESOURCES } from "./constants.js";
export function assert(condition,message="Invalid operation") { if (!condition) throw new Error(message); }
export function money(cost={}) {
  assert(cost && typeof cost==="object" && !Array.isArray(cost),"Invalid cost");
  const result=Object.fromEntries(RESOURCES.map(k=>[k,0]));
  for (const [k,v] of Object.entries(cost)) {
    assert(RESOURCES.includes(k),"Unknown resource: "+k);
    assert(Number.isSafeInteger(v)&&v>=0,"Resource amount must be nonnegative integer");
    result[k]=v;
  }
  return result;
}
export function affordable(stock,cost) { return RESOURCES.every(k=>stock[k]>=money(cost)[k]); }
export function spend(stock,cost) {
  const normal=money(cost);assert(affordable(stock,normal),"Insufficient resources");
  for (const k of RESOURCES)stock[k]-=normal[k];
}
export function grant(stock,cost) {
  const normal=money(cost);for (const k of RESOURCES) stock[k]+=normal[k];
}
export function refund(stock,cost,fraction) {
  assert(Number.isFinite(fraction)&&fraction>=0&&fraction<=1,"Invalid refund fraction");
  grant(stock,Object.fromEntries(Object.entries(money(cost)).map(([k,v])=>[k,Math.floor(v*fraction)])));
}
export function ageIndex(age) {return ["I","II","III","IV","V"].indexOf(age);}
export function clone(v){return structuredClone(v);}
export function stable(v){if(Array.isArray(v))return "["+v.map(stable).join(",")+"]";if(v&&typeof v==="object")return "{"+Object.keys(v).sort().map(k=>JSON.stringify(k)+":"+stable(v[k])).join(",")+"}";return JSON.stringify(v);}
export function hash(v) {let h=2166136261;for(const c of stable(v)){h^=c.charCodeAt(0);h=Math.imul(h,16777619);}return (h>>>0).toString(16).padStart(8,"0");}
