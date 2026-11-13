/** Deterministic original faction art generator. Re-run with npm run generate-faction-art. */
import {readFile,mkdir,writeFile} from "node:fs/promises";
const FSTYLE={"humans":{"color":[0.21,0.43,0.67],"armor":[0.65,0.7,0.78],"skin":[0.85,0.67,0.51],"trim":[0.91,0.76,0.31],"size":[1,1,1]},"orcs":{"color":[0.56,0.2,0.14],"armor":[0.3,0.35,0.31],"skin":[0.39,0.57,0.31],"trim":[0.77,0.47,0.19],"size":[1.22,1.12,1.15]},"dwarfs":{"color":[0.27,0.46,0.54],"armor":[0.72,0.55,0.27],"skin":[0.79,0.57,0.43],"trim":[0.92,0.72,0.34],"size":[1.19,0.77,1.16]},"tree-elves":{"color":[0.18,0.5,0.34],"armor":[0.4,0.59,0.34],"skin":[0.79,0.68,0.51],"trim":[0.61,0.81,0.34],"size":[0.85,1.16,0.9]},"corrupt-elves":{"color":[0.42,0.19,0.56],"armor":[0.26,0.22,0.32],"skin":[0.58,0.51,0.64],"trim":[0.82,0.32,0.69],"size":[0.89,1.15,0.91]},"ursa":{"color":[0.5,0.31,0.2],"armor":[0.49,0.46,0.41],"skin":[0.55,0.38,0.28],"trim":[0.88,0.74,0.43],"size":[1.31,1.09,1.24]}};
const ROLES=["worker","infantry","ranged","hero","siege","ship","air","civilian","defense","tower"];
function createFactionObj(baseObj,faction,role){
 const cfg=FSTYLE[faction];if(!cfg)throw Error("Unknown faction");
 let count=0,out=[];
 const lines=baseObj.split(/\r?\n/);
 for(const line of lines){
  if(line.startsWith("v ")){
   const p=line.slice(2).trim().split(/\s+/).map(Number);
   const transformed=p.map((v,i)=>v*cfg.size[i]);
   out.push("v "+transformed.map(v=>+v.toFixed(5)).join(" "));count++;
  }else if(line.startsWith("mtllib ")){
   out.push("mtllib ../../crowns-palette.mtl");
  }else if(line.startsWith("usemtl ")){
   const orig=line.slice(7).trim();
   const material=orig==="cloth"?`${faction}_primary`:orig==="armor"?`${faction}_armor`:
    orig==="skin"?`${faction}_skin`:orig==="accent"?`${faction}_primary`:
    orig==="gold"?`${faction}_trim`:orig;
   out.push("usemtl "+material);
  }else if(line.trim())out.push(line);
 }
 out.unshift(`# Faction-unique low-poly polygon art: ${faction} / ${role}`);
 const mesh=[],facets=[];
 const pushFace=(vs,material)=>{const start=count+1;for(const v of vs){mesh.push("v "+v.map(x=>+x.toFixed(5)).join(" "));count++;}
 facets.push("usemtl "+material);
 for(let i=1;i<vs.length-1;i++)facets.push(`f ${start} ${start+i} ${start+i+1}`);
 };
 const box=(x,y,z,w,h,d,m)=>{
  const a=x-w/2,b=x+w/2,c=y,e=y+h,f=z-d/2,g=z+d/2;
  for(const face of [
   [[a,c,f],[b,c,f],[b,e,f],[a,e,f]],
   [[b,c,g],[a,c,g],[a,e,g],[b,e,g]],
   [[a,c,g],[a,c,f],[a,e,f],[a,e,g]],
   [[b,c,f],[b,c,g],[b,e,g],[b,e,f]],
   [[a,e,f],[b,e,f],[b,e,g],[a,e,g]],
   [[a,c,g],[b,c,g],[b,c,f],[a,c,f]]])pushFace(face,m);
 };
 const spike=(x,y,z,w,h,m,down=false)=>{
  const sign=down?-1:1;
  const a=[x-w/2,y,z-w/2],b=[x+w/2,y,z-w/2],c=[x+w/2,y,z+w/2],d=[x-w/2,y,z+w/2],tip=[x,y+h*sign,z];
  pushFace([a,b,c,d],m);for(const [q,r] of [[a,b],[b,c],[c,d],[d,a]])pushFace([q,r,tip],m);
 };
 const arch=(x,y,z,w,h,m)=>{
  box(x-w*.45,y,z,w*.18,h,.15,m);
  box(x+w*.45,y,z,w*.18,h,.15,m);
  box(x,y+h-.09,z,w,.19,.16,m);
 };
 const primary=`${faction}_primary`,armor=`${faction}_armor`,
  skin=`${faction}_skin`,trim=`${faction}_trim`;
 const isStructure=["civilian","defense","tower"].includes(role);
 const isShip=role==="ship",isAir=role==="air",isSiege=role==="siege";
 const roof=isStructure?(role==="tower"?3.2:role==="defense"?1.8:1.7):0;
 const h=isStructure?roof:isShip?1.1:isAir?1.1:isSiege?1.4:1.32*cfg.size[1];
 // Every faction gets two or more silhouette-exclusive, material-bearing meshes.
 switch(faction){
  case "humans":
   if(isStructure){arch(0,roof*.48,.70,.72,.82,armor);spike(0,roof+.2,0,.23,.48,trim);}
   else if(isShip||isAir){box(0,h+.1,0,.36,.14,.58,trim);spike(0,h+.25,0,.25,.42,primary);}
   else {box(0,h+.05,-.02,.42,.16,.32,trim);spike(0,h+.20,-.02,.23,.48,primary);
    box(-.4,.47,.05,.17,.52,.19,trim);}
   break;
  case "orcs":
   if(isStructure){spike(-.55,roof,0,.32,.75,armor);spike(.55,roof,0,.32,.75,armor);
    box(0,roof*.55,.68,.82,.23,.18,primary);}
   else {spike(-.36,h-.25,.02,.24,.56,armor);spike(.36,h-.25,.02,.24,.56,armor);
    box(0,h*.48,-.22,.86,.28,.24,primary);}
   break;
  case "dwarfs":
   if(isStructure){box(0,roof*.66,.69,1.25,.25,.26,armor);
    box(0,roof+.03,0,.82,.20,.83,trim);}
   else {box(0,h*.55,-.21,.95,.35,.3,armor);box(0,h+.02,0,.63,.25,.59,trim);
    box(.55,h*.38,.04,.32,.5,.3,armor);}
   break;
  case "tree-elves":
   if(isStructure){spike(-.63,roof-.05,0,.32,.96,primary);spike(.63,roof-.05,0,.32,.96,primary);
    box(0,roof+.2,.0,.18,.65,.14,armor);}
   else {spike(-.24,h-.08,0,.18,.76,primary);spike(.24,h-.08,0,.18,.76,primary);
    box(0,h*.52,-.23,.38,.30,.21,trim);}
   break;
  case "corrupt-elves":
   if(isStructure){spike(-.52,roof-.05,.15,.30,.90,primary);
    spike(.52,roof-.05,.15,.30,.90,primary);spike(0,roof,.15,.34,1.00,trim);}
   else {spike(-.29,h-.20,-.08,.20,.75,trim);spike(.29,h-.20,-.08,.20,.75,trim);
    spike(0,h*.52,-.27,.29,.48,primary);}
   break;
  case "ursa":
   if(isStructure){box(-.60,roof*.43,.48,.40,.63,.38,armor);
    box(.60,roof*.43,.48,.40,.63,.38,armor);spike(0,roof,.0,.45,.54,trim);}
   else {box(-.39,h-.04,.02,.34,.36,.42,skin);box(.39,h-.04,.02,.34,.36,.42,skin);
    box(0,h*.71,.31,.51,.24,.38,skin);box(0,h*.35,-.31,.85,.33,.32,armor);}
 }
 // Role-level finishing elements: avoid purely color-swapped models.
 if(role==="hero"){spike(0,h+.35,0,.25,.35,trim);}
 if(role==="ranged"){box(.42,h*.62,.22,.16,.36,.2,trim);}
 if(role==="siege"){spike(0,h+.1,.58,.32,.42,armor);}
 if(role==="air"){box(0,h*.51,-.54,.70,.12,.23,primary);}
 if(role==="ship"){box(0,h+.45,.02,.45,.43,.10,primary);}
 if(role==="defense"){spike(0,h+.24,0,.30,.45,trim);}
 out.push(...mesh,...facets);
 return out.join("\n")+"\n";
}
function factionMtlAppend(){let out="\n# Crowns of Iron faction-identifying materials\n";for(const [name,c] of Object.entries(FSTYLE)){
 for(const [key,rgb] of Object.entries({primary:c.color,armor:c.armor,skin:c.skin,trim:c.trim})){
  out+=`newmtl ${name}_${key}\nKd ${rgb.map(v=>v.toFixed(3)).join(" ")}\nKa 0.10 0.10 0.10\nKs 0.07 0.07 0.07\nillum 2\n\n`;
 }
 }return out;}
for(const faction of Object.keys(FSTYLE))for(const role of ROLES){
 const base=await readFile(new URL("../assets/models/"+role+".obj",import.meta.url),"utf8");
 const url=new URL("../assets/models/factions/"+faction+"/"+role+".obj",import.meta.url);
 await mkdir(new URL("./",url),{recursive:true});
 await writeFile(url,createFactionObj(base,faction,role),"utf8");
}
const source=new URL("../assets/models/crowns-palette.mtl",import.meta.url);
const original=await readFile(source,"utf8");
const marker="# Crowns of Iron faction-identifying materials";
await writeFile(source,original.split(marker)[0].trimEnd()+"\n"+factionMtlAppend(),"utf8");
console.log("Generated 60 original faction-specific OBJ meshes and updated shared MTL.");
