/** Reproducible generator for 216 individual role-specific OBJ files.
 * Exported output is an editable, actual triangular 3D mesh, not only a skin. */
import {readFile,writeFile,mkdir} from "node:fs/promises";
import {ROSTER_ROLES,roleFamily,ROLE_SLUGS} from "../web/rosterArt.js";
import {FACTION_SLUGS} from "../web/factionArt.js";
const ROLE=ROSTER_ROLES;
function family(role){
 if(ROLE.slice(22,30).includes(role))return "ship";
 if(ROLE.slice(30).includes(role))return "air";
 if(["Battering Ram","Siege Tower","Heavy Artillery","Heavy War Machine","Legendary Land"].includes(role))return "siege";
 if(["Healer","Converter","Hero"].includes(role))return "hero";
 if(["Stone Slinger","Archer","Gunner","Anti-Air Infantry","Scout"].includes(role))return "ranged";
 return role==="Worker"?"worker":"infantry";
}
function makeRoleObj(base,faction,role){
 const roles=ROLE;const idx=roles.indexOf(role);if(idx<0)throw Error("unknown role");
 let count=(base.match(/^v /gm)||[]).length;
 const verts=[],faces=[];let current="";
 const color=key=>faction+"_"+key;
 const face=(pts,mat)=>{const start=count+1;for(const p of pts){verts.push("v "+p.map(x=>+x.toFixed(5)).join(" "));count++;}
 if(mat!==current){faces.push("usemtl "+mat);current=mat;}
 for(let i=1;i<pts.length-1;i++)faces.push(`f ${start} ${start+i} ${start+i+1}`);
 };
 const box=(x,y,z,w,h,d,m)=>{const a=x-w/2,b=x+w/2,c=y,e=y+h,f=z-d/2,g=z+d/2;
 for(const q of [[[a,c,f],[b,c,f],[b,e,f],[a,e,f]],[[b,c,g],[a,c,g],[a,e,g],[b,e,g]],[[a,c,g],[a,c,f],[a,e,f],[a,e,g]],[[b,c,f],[b,c,g],[b,e,g],[b,e,f]],[[a,e,f],[b,e,f],[b,e,g],[a,e,g]],[[a,c,g],[b,c,g],[b,c,f],[a,c,f]]])face(q,m);
 };
 const spike=(x,y,z,w,h,m,down=false)=>{
 const a=[x-w/2,y,z-w/2],b=[x+w/2,y,z-w/2],c=[x+w/2,y,z+w/2],d=[x-w/2,y,z+w/2],t=[x,y+(down?-h:h),z];
 face([a,b,c,d],m);for(const pair of [[a,b],[b,c],[c,d],[d,a]])face([...pair,t],m);
 };
 const rod=(a,b,r,m)=>{
 const dx=b[0]-a[0],dy=b[1]-a[1],dz=b[2]-a[2],len=Math.hypot(dx,dy,dz);
 if(len<.001)return;
 const up=Math.abs(dy/len)>.9?[1,0,0]:[0,1,0];
 let u=[dy*up[2]-dz*up[1],dz*up[0]-dx*up[2],dx*up[1]-dy*up[0]],l=Math.hypot(...u);u=u.map(q=>q/l);
 let v=[dy*u[2]-dz*u[1],dz*u[0]-dx*u[2],dx*u[1]-dy*u[0]],vl=Math.hypot(...v);v=v.map(q=>q/vl);
 const p=[],q=[];for(let i=0;i<6;i++){const t=i*Math.PI/3,offset=u.map((s,j)=>(s*Math.cos(t)+v[j]*Math.sin(t))*r);
 p.push(a.map((s,j)=>s+offset[j]));q.push(b.map((s,j)=>s+offset[j]));}
 face(p,m);face([...q].reverse(),m);for(let i=0;i<6;i++)face([p[i],p[(i+1)%6],q[(i+1)%6],q[i]],m);
 };
 const main=color("primary"),trim=color("trim"),armor=color("armor"),skin=color("skin");
 const isAir=idx>=30,isShip=idx>=22&&idx<30,heavy=["siege","ship","air"].includes(family(role));
 const y=heavy?.8:1.15;
 // Role-specific attachments: separate mechanical geometry, not just a palette swap.
 switch(role){
 case "Worker":box(.27,.22,.43,.30,.41,.32,armor);rod([.48,.45,.22],[.50,1.34,.27],.055,trim);break;
 case "Scout":rod([.35,.23,.15],[.40,1.73,.20],.034,trim);spike(.4,1.72,.2,.24,.42,main);break;
 case "Club Fighter":rod([.46,.36,.25],[.48,1.52,.3],.12,armor);spike(.48,1.55,.3,.38,.21,trim);break;
 case "Stone Slinger":rod([-.40,.70,.20],[-.72,1.28,.20],.055,trim);rod([-.32,.75,.20],[-.11,1.31,.20],.035,trim);break;
 case "Stone Spearman":rod([.42,.21,.2],[.48,2.16,.22],.045,armor);spike(.48,2.13,.22,.23,.45,trim);break;
 case "Swordsman":box(-.35,.54,.36,.45,.36,.13,armor);rod([.45,.24,.25],[.5,1.45,.3],.065,trim);break;
 case "Archer":rod([.5,.3,.35],[.72,1.53,.35],.045,trim);rod([.72,1.53,.35],[.5,.87,.35],.019,skin);break;
 case "Pikeman":rod([.50,.10,.2],[.50,2.52,.2],.035,armor);spike(.5,2.42,.2,.23,.53,trim);break;
 case "Raider":for(const s of [-1,1]){rod([s*.43,.40,.23],[s*.55,1.43,.23],.07,armor);box(s*.55,1.3,.23,.31,.27,.13,trim);}break;
 case "Heavy Infantry":for(const s of [-1,1])box(s*.45,.85,0,.38,.31,.37,armor);box(0,1.48,0,.55,.25,.5,trim);break;
 case "Heavy Mobile":box(0,.54,-.35,1.17,.46,.62,armor);spike(-.48,.95,-.35,.3,.5,trim);spike(.48,.95,-.35,.3,.5,trim);break;
 case "Battering Ram":rod([0,.83,.4],[0,.83,1.85],.20,armor);spike(0,.80,1.9,.46,.45,trim);break;
 case "Siege Tower":for(const s of [-1,1])box(s*.43,.7,-.1,.17,1.9,.17,armor);box(0,2.42,-.12,1.3,.25,.85,main);break;
 case "Healer":rod([.42,.1,.28],[.42,2.00,.28],.045,trim);box(.42,1.86,.28,.34,.34,.12,main);break;
 case "Converter":rod([.45,.2,.2],[.45,1.97,.20],.055,armor);for(const s of [-1,1])spike(.45+s*.2,1.98,.2,.19,.39,trim);break;
 case "Hero":box(0,1.64,.25,.63,.32,.22,trim);spike(0,1.98,0,.42,.47,main);break;
 case "Gunner":rod([.48,.69,.05],[.48,.69,1.55],.12,armor);box(.48,.65,1.57,.35,.26,.12,trim);break;
 case "Heavy Artillery":rod([0,1.14,.05],[0,1.18,2.14],.22,armor);box(0,.35,-.7,1.2,.39,.57,main);break;
 case "Anti-Air Infantry":rod([.4,.47,0],[.39,2.08,.74],.12,armor);spike(.39,2.00,.70,.31,.5,trim);break;
 case "Mechanized Infantry":box(0,.55,-.42,.7,.77,.38,armor);for(const s of [-1,1])box(s*.39,.22,.05,.16,.8,.29,trim);break;
 case "Heavy War Machine":for(const s of [-1,1])rod([s*.42,1.0,.17],[s*.42,1.02,2.03],.22,armor);box(0,.58,-.58,1.31,.75,.59,trim);break;
 case "Legendary Land":box(0,1.58,-.4,1.36,.44,.69,armor);for(const s of [-1,1])spike(s*.67,1.8,-.28,.45,.87,trim);break;
 case "Raft":for(const s of [-1,1])rod([s*.55,.3,-.75],[s*.7,.1,1.07],.08,trim);break;
 case "Fishing Vessel":for(const s of [-1,1])rod([s*.53,.55,.10],[s*.65,1.17,.45],.045,armor);box(0,.45,.75,.52,.12,.55,main);break;
 case "Trade Ship":for(const z of [-.62,-.05,.52])box(0,.37,z,.69,.53,.47,main);break;
 case "Transport Ship":box(0,.49,-.28,.91,.65,1.06,armor);box(0,1.12,-.18,.77,.21,.96,trim);break;
 case "Light Warship":rod([0,.7,.67],[0,.71,1.64],.15,armor);break;
 case "Heavy Warship":for(const z of [-.59,.59])rod([0,.73,z],[0,.73,z+1.00],.20,armor);break;
 case "Naval Siege Ship":rod([0,.55,-.37],[0,1.78,.58],.10,trim);spike(0,1.77,.58,.35,.48,armor);break;
 case "Legendary Warship":for(const z of [-.68,.52]){box(0,1.15,z,1.03,.58,.15,main);spike(0,1.72,z,.44,.55,trim);}break;
 case "Scout Aircraft":box(0,.68,.61,.60,.29,.35,main);rod([0,.84,.57],[0,1.53,.57],.05,trim);break;
 case "Interceptor":for(const s of [-1,1])spike(s*.7,.62,-.15,.38,.57,armor);break;
 case "Gunship":for(const s of [-1,1])rod([s*.7,.48,.36],[s*.7,.47,1.43],.13,armor);break;
 case "Bomber":for(const s of [-1,1]){box(s*.55,.1,.27,.29,.28,.47,armor);spike(s*.55,.1,.27,.23,.37,trim,true);}break;
 case "Air Transport":box(0,.12,-.25,1.13,.56,.83,main);box(0,.66,-.15,.77,.25,.72,armor);break;
 case "Aerial Battleship":for(const s of [-1,1]){rod([s*.67,.51,.12],[s*.66,.48,1.82],.23,armor);box(s*.65,.78,-.5,.69,.28,.36,main);}break;
 }
 // Visible heraldic token makes every role archetype unique within each faction.
 const markX=((idx%6)-2.5)*.11;
 box(markX,heavy?1.02:.42,heavy?-.55:-.38,.08+.025*(idx%4),.17,.09,idx%2?trim:main);
 const lines=base.trimEnd().split("\n");
 lines.unshift("# Original archetype-specific 3D art: "+faction+" / "+role);
 lines.push(...verts,...faces);
 return lines.join("\n")+"\n";
}
for(const faction of FACTION_SLUGS)for(const role of ROLE){
 const base=await readFile(new URL("../assets/models/factions/"+faction+"/"+
  roleFamily(role)+".obj",import.meta.url),"utf8");
 const url=new URL("../assets/models/roster/"+faction+"/"+ROLE_SLUGS[role]+".obj",import.meta.url);
 await mkdir(new URL("./",url),{recursive:true});
 await writeFile(url,makeRoleObj(base,faction,role),"utf8");
}
console.log("Generated all 216 faction × role Wavefront OBJ models.");
