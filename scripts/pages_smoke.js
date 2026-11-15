/** Real Chromium smoke for the static site, hosted at /crowns-of-iron/.
 * Uses browser Worker and IndexedDB, no simulation HTTP endpoints. */
import {createServer} from "node:http";
import {readFile,stat} from "node:fs/promises";
import {join,resolve,extname} from "node:path";
import {fileURLToPath} from "node:url";
import {chromium} from "playwright";
import assert from "node:assert/strict";
const root=resolve(new URL("../dist/pages/",import.meta.url).pathname);
const base="/crowns-of-iron/";
const mime={".html":"text/html;charset=utf-8",".js":"text/javascript;charset=utf-8",
 ".json":"application/json;charset=utf-8",".obj":"text/plain;charset=utf-8",
 ".mtl":"text/plain;charset=utf-8",".ppm":"text/plain;charset=utf-8",
 ".gltf":"model/gltf+json;charset=utf-8",".png":"image/png"};
const server=createServer(async(req,res)=>{
 try{
  let path=decodeURIComponent(new URL(req.url,"http://localhost").pathname);
  if(!path.startsWith(base))throw Error("Unknown prefix");
  path=path.slice(base.length);
  if(path.includes("..")||path.startsWith("/"))throw Error("Unsafe path");
  let candidate=join(root,path);
  if(!path||path.endsWith("/"))candidate=join(candidate,"index.html");
  const file=await stat(candidate);
  if(!file.isFile())throw Error("Directory");
  const content=await readFile(candidate);
  res.writeHead(200,{"content-type":mime[extname(candidate)]??"application/octet-stream"});
  res.end(content);
 }catch{res.writeHead(404);res.end("Not found");}
});
await new Promise(resolve=>server.listen(0,"127.0.0.1",resolve));
const url="http://127.0.0.1:"+server.address().port+base;
let browser;
try{
 browser=await chromium.launch({headless:true,args:["--no-sandbox",
  "--use-angle=swiftshader","--enable-unsafe-swiftshader"]});
 const page=await browser.newPage({viewport:{width:1440,height:990}});
 const errors=[];
 page.on("pageerror",e=>errors.push(e.message));
 page.on("console",m=>{if(m.type()==="error")errors.push("console "+m.text());});
 await page.goto(url,{waitUntil:"domcontentloaded"});
 await page.waitForSelector("#setupTitle");
 // No legacy 2D canvas or view-switch affordance ships in the game.
 assert.equal(await page.locator("#map").count(),0,"Legacy 2D canvas still present");
 assert.equal(await page.locator("#view").count(),0,"Legacy view switch still present");
 assert.equal(await page.locator("#map3d").count(),1,"3D game canvas missing");
 assert.equal(await page.locator("#map3d").isHidden(),false,"3D game canvas hidden");
 const fullscreenLayout=await page.evaluate(()=>{
  const rect=document.querySelector("#map3d").getBoundingClientRect();
  return {width:rect.width,height:rect.height,viewWidth:innerWidth,viewHeight:innerHeight};
 });
 assert.equal(fullscreenLayout.width,fullscreenLayout.viewWidth,"Battlefield does not fill viewport width");
 assert.equal(fullscreenLayout.height,fullscreenLayout.viewHeight,"Battlefield does not fill viewport height");
 assert.equal(await page.locator("#empirePanel").isHidden(),true,"Empire drawer should start collapsed");
 await page.click("#toggleEmpire");
 assert.equal(await page.locator("#empirePanel").isHidden(),false,"Empire management overlay should open");
 await page.click("#closeEmpire");
 assert.equal(await page.locator("#empirePanel").isHidden(),true,"Empire management overlay should close");
 try{
  await page.waitForFunction(()=>document.querySelector("#messages")?.textContent
   ?.includes("3D models loaded"),null,{timeout:15000});
 }catch(e){
  throw Error("3D initialization failed: "+
   await page.locator("#messages").textContent()+
   " | page errors: "+errors.join("; ")+
   " | status: "+await page.locator("#status").textContent());
 }
 await page.selectOption("#enemies","1");
 await page.selectOption("#difficulty","Easy");
 await page.click("#launch");
 await page.waitForFunction(()=>document.querySelector("#empire")?.textContent
  ?.includes("Age I"),null,{timeout:60000});
 await page.waitForFunction(()=>document.querySelector("#empire")?.textContent
  ?.includes("s"),null,{timeout:15000});
 assert.ok(!(await page.locator("#map3d").isHidden()),"3D battlefield hidden");
 // Verify the 3D player controls are available in the actual match.
 await page.click("#workers");
 await page.waitForFunction(()=>document.querySelector("#selection")?.textContent
  ?.includes("Worker"),null,{timeout:15000});
 // Verify the primary 3D camera responds to keyboard and wheel input.
 await page.waitForFunction(()=>document.querySelector("#cameraStatus")?.textContent
  ?.includes("Zoom"),null,{timeout:15000});
 const initialCamera=await page.locator("#cameraStatus").textContent();
 await page.keyboard.down("d");
 await page.waitForTimeout(450);
 await page.keyboard.up("d");
 await page.waitForFunction(initial=>
  document.querySelector("#cameraStatus")?.textContent!==initial,
  initialCamera,{timeout:5000});
 const beforeWheel=await page.locator("#cameraStatus").textContent();
 await page.locator("#map3d").hover({position:{x:200,y:200}});
 await page.mouse.wheel(0,-700);
 await page.waitForFunction(before=>
  document.querySelector("#cameraStatus")?.textContent.match(/Zoom ([0-9]+)/)?.[1]!==
   before.match(/Zoom ([0-9]+)/)?.[1],
  beforeWheel,{timeout:5000});
 await page.keyboard.press("Backspace");
 assert.equal(await page.locator("#view").count(),0,"2D toggle must remain absent");
 await page.click("#pause");
 await page.waitForFunction(()=>document.querySelector("#status")?.textContent
  ?.includes("Paused"));
 await page.click("#step");
 await page.click("#saveGame");
 await page.waitForFunction(()=>document.querySelector("#messages")?.textContent
  ?.includes("Skirmish saved on this device"),null,{timeout:15000});
 await page.click("#loadGame");
 try{await page.waitForFunction(()=>document.querySelector("#messages")?.textContent
  ?.includes("Saved match loaded"),null,{timeout:15000});}
 catch(e){throw Error("Restore smoke failed: "+
  await page.locator("#messages").textContent()+" Browser errors: "+errors.join("; "));}
 // The 3D renderer remains visible through pause, step and save/load.
 assert.equal(await page.locator("#map3d").isHidden(),false);
 assert.equal(await page.locator("#map").count(),0);
 await page.goto(url+"model-gallery/",{waitUntil:"domcontentloaded"});
 await page.waitForFunction(()=>document.querySelector("#details")?.textContent
  ?.includes("All 60 faction meshes loaded"),null,{timeout:60000});
 // Mobile portrait must stop play, while landscape uses a full-screen 3D battlefield
 // with touch-friendly management controls over the map.
 const mobile=await browser.newContext({
  viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true
 });
 const phone=await mobile.newPage();
 const phoneErrors=[];
 phone.on("pageerror",e=>phoneErrors.push(e.message));
 await phone.goto(url,{waitUntil:"domcontentloaded"});
 await phone.waitForSelector("#orientationGate");
 assert.equal(await phone.locator("#orientationGate").isVisible(),true,
  "Portrait mobile gameplay must show rotate-device blocker");
 await phone.setViewportSize({width:844,height:390});
 await phone.waitForFunction(()=>getComputedStyle(
  document.querySelector("#orientationGate")).display==="none");
 const phoneDimensions=await phone.evaluate(()=>{
  const bounds=document.querySelector("#map3d").getBoundingClientRect();
  return {width:bounds.width,height:bounds.height,vw:innerWidth,vh:innerHeight};
 });
 assert.equal(phoneDimensions.width,phoneDimensions.vw);
 assert.equal(phoneDimensions.height,phoneDimensions.vh);
 await phone.selectOption("#enemies","1");
 await phone.click("#launch");
 await phone.waitForFunction(()=>document.querySelector("#empire")?.textContent
  ?.includes("Age I"),null,{timeout:60000});
 await phone.click("#toggleEmpire");
 assert.equal(await phone.locator("#empirePanel").isVisible(),true);
 await phone.click("#closeEmpire");
 assert.equal(await phone.locator("#empirePanel").isHidden(),true);
 await phone.locator("#map3d").tap({position:{x:300,y:210}});
 await phone.setViewportSize({width:390,height:844});
 await phone.waitForFunction(()=>getComputedStyle(
  document.querySelector("#orientationGate")).display!=="none");
 assert.deepEqual(phoneErrors,[],"Mobile runtime errors");
 await mobile.close();
 assert.deepEqual(errors,[],"Browser runtime errors");
 console.log(JSON.stringify({staticPages:true,workerSkirmish:true,
  pauseStepSaveRestore:true,webglRender:true,only3D:true,gallery:true,
  fullscreenBattlefield:true,landscapeMobile:true,overlayEmpire:true,
  errors:errors.length,base:url}));
}finally{
 await browser?.close();
 await new Promise(resolve=>server.close(resolve));
}
