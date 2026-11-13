import {createServer} from "node:http";
import {readFile,stat} from "node:fs/promises";
import {resolve,join,extname,relative} from "node:path";
const root=resolve(import.meta.dirname,"..");
const PORT=Number(process.env.PORT??5173),HOST="127.0.0.1";
const mime={".html":"text/html; charset=utf-8",".js":"text/javascript; charset=utf-8",".css":"text/css; charset=utf-8",".json":"application/json; charset=utf-8"};
const server=createServer(async(req,res)=>{
 try{
  const u=new URL(req.url,"http://"+HOST);
  let path=u.pathname==="/"?"/web/index.html":u.pathname;
  path=decodeURIComponent(path);
  if(!(/^\/(web|src)\//.test(path))||path.includes("\0"))throw new Error("Invalid request path");
  const file=resolve(root,"."+path);
  if(relative(root,file).startsWith(".."))throw new Error("Path traversal");
  const contents=await readFile(file);
  res.writeHead(200,{"Content-Type":mime[extname(file)]??"application/octet-stream","X-Content-Type-Options":"nosniff","Cache-Control":"no-store"});
  res.end(contents);
 }catch(e){res.writeHead(404,{"Content-Type":"text/plain; charset=utf-8"});res.end("Not found");}
});
server.listen(PORT,HOST,()=>console.log("Crowns of Iron inspector: http://"+HOST+":"+PORT));
