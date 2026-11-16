/** Adaptive browser WebGL render policy. Pure state machine, no browser globals. 
 * Frame budget includes CPU mesh generation and GPU submission; this is
 * intentionally coarse and cannot measure asynchronous GPU frame time. */
export function createRenderQuality({mobile=false,devicePixelRatio=1,mode="Auto"}={}){
 if(!["Auto","Performance","Quality"].includes(mode))throw Error("Invalid graphics mode");
 // Browsers may temporarily report zero or nonfinite DPR during resize,
 // orientation transitions or WebView lifecycle changes.
 const safeDpr=Number.isFinite(devicePixelRatio)&&devicePixelRatio>0
  ?devicePixelRatio:1;
 const maximum=mobile?Math.min(1.35,safeDpr):Math.min(1.75,safeDpr);
 const minimum=mobile?Math.min(.7,maximum):Math.min(.85,maximum);
 let scale=mode==="Performance"?minimum:maximum;
 let interval=mobile?1000/30:1000/45;
 let slow=0,fast=0,lastAdjustment=0,lastObserved=-Infinity,average=0,samples=0;
 function observe(ms,atMs){
  if(!Number.isFinite(ms)||ms<0||!Number.isFinite(atMs)||atMs<=lastObserved)return false;
  // A suspended mobile tab may resume many seconds later. Old slow/fast
  // streaks and frame averages must not drive a fresh scene's resolution.
  if(lastObserved!==-Infinity&&atMs-lastObserved>10000){
   average=0;samples=slow=fast=0;
   lastAdjustment=atMs;
  }
  lastObserved=atMs;
  average=average?average*.85+ms*.15:ms;
  samples++;
  if(mode!=="Auto"||samples<12||atMs-lastAdjustment<3500)return false;
  // Sustained slow draw calls lower resolution before lowering the target rate.
  if(average>(mobile?29:23)){slow++;fast=0;}else if(average<(mobile?15:12)){fast++;slow=0;}
  else {slow=0;fast=0;}
  if(slow>=4){
   const prior=scale;
   scale=Math.max(minimum,Math.round((scale-.15)*100)/100);
   if(scale===prior)interval=Math.min(1000/24,interval+3);
   slow=0;lastAdjustment=atMs;
   return scale!==prior;
  }
  if(fast>=28){
   const prior=scale;
   scale=Math.min(maximum,Math.round((scale+.1)*100)/100);
   interval=mobile?1000/30:1000/45;
   fast=0;lastAdjustment=atMs;
   return scale!==prior;
  }
  return false;
 }
 function setMode(next){
  if(!["Auto","Performance","Quality"].includes(next))throw Error("Invalid graphics mode");
  mode=next;scale=next==="Performance"?minimum:maximum;average=0;
  samples=slow=fast=0;lastAdjustment=0;lastObserved=-Infinity;interval=mobile?1000/30:1000/45;
 }
 return {observe,setMode,scale:()=>scale,frameInterval:()=>interval,
  stats:()=>({mode,mobile,scale,averageMs:Math.round(average*10)/10,
   targetFps:Math.round(1000/interval),samples})};
}
