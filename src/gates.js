import {assert} from "./util.js";
import {getPlayer} from "./state.js";
const GATES=new Set(["Primitive Gate","Stone Gatehouse","Industrial Gate","Powered Gate"]);
export function setGateOpen(match,owner,siteId,open){
 assert(typeof open==="boolean","Gate state must be Boolean");
 const site=match.constructions?.[siteId];
 assert(site&&site.completed&&GATES.has(site.kind),"Completed gate not found");
 const player=getPlayer(match,owner);
 assert(site.owner===player.id,"Gate not owned");
 site.gateOpen=open;
 return {siteId,open};
}
export function isGateType(name){return GATES.has(name);}
