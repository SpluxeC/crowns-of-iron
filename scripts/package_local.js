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
const instructions=`# Crowns of Iron — Local Browser Playtest

This is an **experimental local browser RTS prototype**, not a finished game,
standalone executable, or publicly hosted online multiplayer service.

## Requirements

Install Node.js **22 or newer** on Windows, macOS, or Linux. A modern desktop
browser with WebGL is required. The bundle uses Node built-ins only — no
`npm install`, repository clone, Python, or third-party runtime dependencies.

## Start playing

1. Extract the ZIP archive into a folder.
2. On Windows, double-click **START-WINDOWS.cmd**. On macOS/Linux, open a
   terminal in the extracted `crowns-of-iron-local` folder and execute
   `sh START-MAC-LINUX.sh`. Alternatively run `npm start`.
3. Keep the server terminal open. It prints separate short-lived session tokens
   for the local human and orc players.
4. On the **same computer**, open **http://127.0.0.1:5190/client** in the browser.
5. Enter the `human` session token printed by the terminal; a second tab can
   use the `orc` token. Do **not** share either session token publicly.
6. For the 3D gallery, visit **http://127.0.0.1:5190/model-gallery**.
7. Stop the local server with Ctrl+C.

## Existing save protection

The server stores developer checkpoints in `.local/crowns-host-checkpoint.json`.
If it refuses to restart because one already exists, do not delete that file
without deciding whether to keep it. To restore, set `RESTORE_CHECKPOINT=1`
before running `npm start`. To reset and lose the old checkpoint, set
`RESET_CHECKPOINT=1` before running `npm start`.

## Boundaries

- The web server intentionally binds **only 127.0.0.1** and is **not accessible
  on another device**. Do not expose port 5190, use a public tunnel or forward
  the server to the Internet; the developer session-token model and transport
  are not designed for that.
- There is no accounts system, Internet matchmaking, public TLS, finalized
  competitive balance, production anti-cheat or installable desktop binary.
- This playtest includes source assets and renders within a browser. Gameplay
  completeness and hardware compatibility are still under development.
- The project currently reserves rights; this ZIP is for personal playtesting,
  not unrestricted commercial redistribution.
\n`;
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
