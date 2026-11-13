/** Small bounded client-side timing recorder. Rendering costs are CPU submit times,
 * not actual GPU frame completion or a stable FPS estimate. */
export function percentile(values,p){
 if(!values.length)return null;
 const sorted=[...values].sort((a,b)=>a-b);
 const index=Math.min(sorted.length-1,Math.max(0,Math.ceil(sorted.length*p)-1));
 return sorted[index];
}
export function createPerformanceTelemetry({limit=120}={}){
 if(!Number.isInteger(limit)||limit<1||limit>10000)throw Error("Invalid sample limit");
 const samples=new Map();
 return {
  record(name,ms){
   if(typeof name!=="string"||!name||!Number.isFinite(ms)||ms<0)return false;
   const list=samples.get(name)??[];
   list.push(ms);if(list.length>limit)list.shift();
   samples.set(name,list);return true;
  },
  summary(name){
   const list=samples.get(name)??[];
   return {count:list.length,p50:percentile(list,.5),p95:percentile(list,.95),
    worst:list.length?Math.max(...list):null};
  },
  reset(){samples.clear();},
  names(){return [...samples.keys()];}
 };
}
export function formatTiming(stats){
 return stats.count?("p50 "+stats.p50.toFixed(1)+"ms · p95 "+
  stats.p95.toFixed(1)+"ms · n="+stats.count):"Collecting samples";
}
