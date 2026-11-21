/** Adaptive browser WebGL render policy. Pure state machine, no browser globals. 
 * Frame budget includes CPU mesh generation and GPU submission; this is
 * intentionally coarse and cannot measure asynchronous GPU frame time. */
/** Bound WebGL render-target memory by both its longest edge and total pixels.
 * The CSS battlefield still occupies the full viewport at any quality level. */
export function battlefieldRenderSize(width,height,scale,{mobile=false}={}){
 if(!Number.isFinite(width)||!Number.isFinite(height)||
    !Number.isFinite(scale)||width<=0||height<=0||scale<=0)
  return {width:1,height:1};
 const pixels=mobile?1500000:3000000;
 const limit=Math.min(scale,2048/width,2048/height,
  Math.sqrt(pixels/(width*height)));
 // Floor rather than round: rounding both edges up can exceed the GPU
 // memory cap on boundary sizes, particularly during phone rotation.
 return {width:Math.max(1,Math.floor(width*limit)),
  height:Math.max(1,Math.floor(height*limit))};
}
export function createRenderQuality({mobile=false,devicePixelRatio=1,mode="Auto"}={}){
 if(!["Auto","Performance","Quality"].includes(mode))throw Error("Invalid graphics mode");
 // Browsers may temporarily report zero or nonfinite DPR during resize,
 // orientation transitions or WebView lifecycle changes.
 const normalizeDpr=value=>Number.isFinite(value)&&value>0?value:1;
 let currentDpr=normalizeDpr(devicePixelRatio);
 const bounds=value=>{
  const max=mobile?Math.min(1.35,value):Math.min(1.75,value);
  return {maximum:max,minimum:mobile?Math.min(.7,max):Math.min(.85,max)};
 };
 let {maximum,minimum}=bounds(currentDpr);
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
   // Restore the normal cadence; preserve lower resolution until the new
   // scene proves it can sustain the target frame rate.
   interval=mobile?1000/30:1000/45;
  }
  lastObserved=atMs;
  // A backgrounded WebView can report enormous single-frame durations.
  // Preserve slow-frame pressure but bound its impact on the rolling mean.
  const boundedMs=Math.min(ms,250);
  average=average?average*.85+boundedMs*.15:boundedMs;
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
 /** Re-read pixel density after orientation / display / browser zoom changes.
  * Preserve the current Auto quality fraction within safe new bounds. */
 function updateDevicePixelRatio(next){
  const dpr=normalizeDpr(next);
  if(dpr===currentDpr)return false;
  const previousMinimum=minimum,previousMaximum=maximum;
  const progress=previousMaximum>previousMinimum
   ?(scale-previousMinimum)/(previousMaximum-previousMinimum):1;
  currentDpr=dpr;
  ({minimum,maximum}=bounds(currentDpr));
  scale=mode==="Performance"?minimum:mode==="Quality"?maximum:
   Math.max(minimum,Math.min(maximum,
    Math.round((minimum+progress*(maximum-minimum))*100)/100));
  return true;
 }
 function setMode(next){
  if(!["Auto","Performance","Quality"].includes(next))throw Error("Invalid graphics mode");
  mode=next;scale=next==="Performance"?minimum:maximum;average=0;
  samples=slow=fast=0;lastAdjustment=0;lastObserved=-Infinity;interval=mobile?1000/30:1000/45;
 }
 return {observe,setMode,updateDevicePixelRatio,scale:()=>scale,frameInterval:()=>interval,
  stats:()=>({mode,mobile,scale,averageMs:Math.round(average*10)/10,
   targetFps:Math.round(1000/interval),samples})};
}
