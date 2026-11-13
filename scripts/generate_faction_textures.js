/** Reproducible six-faction RGB PPM texture swatches, P3 32x32. */
import {mkdir,writeFile} from "node:fs/promises";
const STYLES={"humans":[[195,214,229],[78,120,171]],"orcs":[[170,166,142],[126,76,57]],"dwarfs":[[216,190,131],[107,137,146]],"tree-elves":[[170,205,139],[67,139,90]],"corrupt-elves":[[192,151,204],[100,57,129]],"ursa":[[201,178,139],[124,94,68]]};
function makeFactionTexture(slug,colors){
 const w=32,h=32,out=["P3","# Original Crowns of Iron procedural surface pattern: "+slug,
 `${w} ${h}`,"255"];
 for(let y=0;y<h;y++){
  const row=[];
  for(let x=0;x<w;x++){
   let motif=false;
   if(slug==="humans")motif=((x+y)%12<3)||(Math.abs(x-15.5)===Math.floor(y/4));
   else if(slug==="orcs")motif=((x*2+y*3)%17<5)||(Math.floor(x/6)+Math.floor(y/6))%5===0;
   else if(slug==="dwarfs")motif=(x%8===0||y%8===0)||(x%8===4&&y%8===4);
   else if(slug==="tree-elves")motif=(Math.abs((x%12)-6)+Math.abs((y%12)-6)<5);
   else if(slug==="corrupt-elves")motif=(Math.abs(x%16-8)===Math.abs(y%16-8))||(x+y)%19<2;
   else motif=((x%13-6)**2+(y%13-6)**2<12);
   const base=motif?colors[1]:colors[0],noise=((x*7+y*13)%9)-4;
   row.push(base.map(c=>Math.max(0,Math.min(255,c+noise))).join(" "));
  }
  out.push(row.join("   "));
 }
 return out.join("\n")+"\n";
}
for(const [slug,colors] of Object.entries(STYLES)){
 const file=new URL("../assets/textures/factions/"+slug+".ppm",import.meta.url);
 await mkdir(new URL("./",file),{recursive:true});
 await writeFile(file,makeFactionTexture(slug,colors),"utf8");
}
console.log("Generated six original 32x32 faction surface pattern PPM textures.");
