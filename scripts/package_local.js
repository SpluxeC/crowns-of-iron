/** Build a dependency-free, local-only browser playtest bundle.
 * Never packages .local checkpoints, Git metadata or private session tokens.
 * Node.js 22+ is required on the receiving computer. */
import {cp,mkdir,rm,writeFile,readdir,stat} from "node:fs/promises";
import {join,resolve,dirname} from "node:path";
import {fileURLToPath} from "node:url";
const project=resolve(dirname(fileURLToPath(import.meta.url)),"..");
const destination=resolve(project,"dist","crowns-of-iron-local");
const parts=["assets","data","src","web","scripts"];
await rm(destination,{recursive:true,force:true});
await mkdir(destination,{recursive:true});
for(const part of parts)await cp(join(project,part),join(destination,part),{
 recursive:true,force:true,filter:(path)=>{
  const relative=path.slice(join(project,part).length);
  return !relative.split(/[\\/]/).some(segment=>[
   ".local",".git","node_modules","artifacts","dist","__pycache__"].includes(segment));
 }});
const packageJson={
 name:"crowns-of-iron-local-playtest",version:"12.0.0",private:true,
 type:"module",description:"Local-only Crowns of Iron browser playtest",
 engines:{node:">=22"},
 scripts:{start:"node scripts/server.js"}
};
await writeFile(join(destination,"package.json"),JSON.stringify(packageJson,null,2)+"\n");
const instructions=["# Crowns of Iron — Local Browser Playtest","","This is an experimental local browser RTS prototype, not a finished game or a public multiplayer service.","","## Requirements","","Install Node.js 22 or newer on Windows, macOS or Linux. Use a modern WebGL desktop browser. No npm install or repository clone is needed.","","## Start playing","","1. Extract this ZIP into a writable folder.","2. On Windows run START-WINDOWS.cmd. On macOS/Linux run: sh START-MAC-LINUX.sh.","3. Keep the server terminal open and note the human session token shown.","4. On the same computer open http://127.0.0.1:5190/client and enter the human token.","5. Optionally open a second tab using the orc token; never share session tokens publicly.","6. Open http://127.0.0.1:5190/model-gallery for the 3D model gallery.","7. Stop the local server using Ctrl+C.","","## Saving and restoring","","Checkpoints live in .local/crowns-host-checkpoint.json. On restart, choose RESTORE_CHECKPOINT=1 to restore or RESET_CHECKPOINT=1 to discard an existing checkpoint. Never delete a saved checkpoint unintentionally.","","## Scope and security","","The server only binds 127.0.0.1. Do not port forward or expose it to the Internet: authentication and networking remain developer-grade. No accounts, HTTPS hosting, matchmaking, production anti-cheat or installer are included. Node.js 22+ is required. This project reserves rights; do not redistribute commercially."] .join("\n")+"\n";
await writeFile(join(destination,"README_PLAYTEST.md"),instructions);
await writeFile(join(destination,"START-WINDOWS.cmd"),
 '@echo off\r\ncd /d "%~dp0"\r\nwhere node >nul 2>nul\r\nif errorlevel 1 (echo Node.js 22+ is required. & pause & exit /b 1)\r\necho Start Crowns of Iron and use the human session token at http://127.0.0.1:5190/client\r\nnode scripts\\server.js\r\npause\r\n');
await writeFile(join(destination,"START-MAC-LINUX.sh"),
 '#!/bin/sh\nset -eu\ncd "$(dirname "$0")"\nif ! command -v node >/dev/null 2>&1; then echo "Node.js 22+ required"; exit 1; fi\necho "Open http://127.0.0.1:5190/client on this computer and enter the human session token"\nexec node scripts/server.js\n');
let files=0,bytes=0;
async function count(dir){for(const name of await readdir(dir)){
 const path=join(dir,name),item=await stat(path);
 if(item.isDirectory())await count(path);
 else{files++;bytes+=item.size;}
}}
await count(destination);
if(files<100||bytes<100000)throw Error("Playtest bundle appears incomplete");
console.log(JSON.stringify({destination,files,bytes,node:process.version,localOnly:true}));
