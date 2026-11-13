/** Real Chromium/SwiftShader visual smoke for the local 3D art viewer.
 * Requires Playwright + browser binaries (installed explicitly in CI).
 * Screenshots are uploaded as workflow artifacts; no fixed visual baseline yet.
 */
import {mkdir,readFile} from "node:fs/promises";
import {createHash} from "node:crypto";
import {fileURLToPath} from "node:url";
import {chromium} from "playwright";
import {MatchHost} from "../src/network.js";
import {createLoopbackProtocolServer} from "../src/loopbackProtocol.js";
const host=new MatchHost([{id:"a",faction:"Humans"},{id:"b",faction:"Ursa"}],712);
const {server}=createLoopbackProtocolServer(host);
await new Promise(resolve=>server.listen(0,"127.0.0.1",resolve));
const base="http://127.0.0.1:"+server.address().port;
const dir=new URL("../artifacts/browser-qa/",import.meta.url);
await mkdir(dir,{recursive:true});
let browser=null;
const summary={platform:"Chromium headless with SwiftShader",cases:[],browserErrors:[]};
try{
 browser=await chromium.launch({headless:true,args:[
  "--no-sandbox","--disable-dev-shm-usage",
  "--use-angle=swiftshader","--enable-unsafe-swiftshader"]});
 const page=await browser.newPage({viewport:{width:1152,height:930},
  deviceScaleFactor:1});
 page.on("pageerror",error=>summary.browserErrors.push(String(error)));
 const failed=[];
 page.on("response",response=>{if(response.status()>=500)failed.push(
  response.status()+" "+response.url());});
 await page.goto(base+"/model-gallery",{waitUntil:"domcontentloaded"});
 await page.waitForFunction(()=>document.querySelector("#details")?.textContent
  ?.includes("All 60 faction meshes loaded"),null,{timeout:60000});
 const gl=await page.evaluate(()=>{
  const canvas=document.getElementById("preview");
  const ctx=canvas?.getContext("webgl");
  return !!ctx&&ctx.getParameter(ctx.VERSION).includes("WebGL");
 });
 if(!gl)throw Error("Real Chromium WebGL context was unavailable");
 async function inspect(faction,role,clip,label,expected){
  await page.selectOption("#faction","base");
  await page.selectOption("#unitRole",role);
  await page.selectOption("#faction",faction);
  await page.selectOption("#clip",clip);
  await page.waitForFunction(({role,expected})=>{
   const text=document.querySelector("#details")?.textContent??"";
   return text.includes(role)&&text.includes(expected);
  },{role,expected},{timeout:60000});
  await page.waitForTimeout(380);
  const path=fileURLToPath(new URL(label+".png",dir));
  await page.screenshot({path,animations:"disabled"});
  const bytes=await readFile(path);
  if(bytes.length<10000)throw Error("Unexpectedly small browser screenshot");
  summary.cases.push({label,faction,role,clip,bytes:bytes.length,
   sha256:createHash("sha256").update(bytes).digest("hex").slice(0,20)});
 }
 await inspect("Humans","Swordsman","walk","humans-swordsman-walk","Skinned glTF");
 await inspect("Ursa","Archer","attack","ursa-archer-attack","Skinned glTF");
 await inspect("Orcs","Bomber","idle","orcs-bomber-idle","Roster OBJ");
 await page.goto(base+"/client",{waitUntil:"domcontentloaded"});
 await page.waitForSelector("#map");
 await page.screenshot({path:fileURLToPath(new URL("client-start-screen.png",dir))});
 if(summary.browserErrors.length||failed.length)
  throw Error("Browser JavaScript or server failures: "+JSON.stringify({
   errors:summary.browserErrors,failed}));
 if(new Set(summary.cases.map(c=>c.sha256)).size!==summary.cases.length)
  throw Error("Faction screenshots unexpectedly identical");
 summary.clientLoaded=true;
 console.log(JSON.stringify(summary,null,2));
}finally{
 await browser?.close();
 await new Promise(resolve=>server.close(resolve));
}
