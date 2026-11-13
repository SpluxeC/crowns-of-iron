import {assert} from "./util.js";
import {getPlayer} from "./state.js";
const GATES=new Set(["Primitive Gate","Stone Gatehouse","Industrial Gate","Powered Gate"]);
export function setGateOpen(match,owner,siteId,open,autoClose=false){
 assert(typeof open==="boolean","Gate state must be Boolean");
 const site=match.constructions?.[siteId];
 assert(site&&site.completed&&GATES.has(site.kind),"Completed gate not found");
 const player=getPlayer(match,owner);
 assert(site.owner===player.id,"Gate not owned");
 assert(typeof autoClose==="boolean","Invalid auto-close flag");
 if(autoClose)assert(player.completed.includes("BLD-05"),"Improved Gate mechanisms required");
 site.gateOpen=open;
 site.gateAutoCloseAtMs=open&&autoClose?match.elapsedMs+5000:null;
 return {siteId,open};
}
export function tickGateMechanisms(match){
 for(const site of Object.values(match.constructions??{})){
  if(site.completed&&site.gateOpen&&site.gateAutoCloseAtMs!==null&&
    site.gateAutoCloseAtMs!==undefined&&match.elapsedMs>=site.gateAutoCloseAtMs){
    site.gateOpen=false;site.gateAutoCloseAtMs=null;
  }
 }
}
export function isGateType(name){return GATES.has(name);}
