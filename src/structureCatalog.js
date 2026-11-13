import {assert,ageIndex} from "./util.js";
const resources=["Food","Wood","Stone","Metal","Gold","Aether"];
export function buildFactionStructures(data,faction){
 const records=data.buildings.rows.filter(r=>r[0]===faction);
 assert(records.length===38,"Expected 38 building entries for "+faction);
 const result={};
 for(const row of records){
   const [owner,age,kind,hp,armor,...tail]=row;
   assert(typeof kind==="string"&&kind&&!result[kind],"Duplicate building "+kind);
   const footprint=String(row[12]).match(/^(\d+)x(\d+)$/);
   assert(footprint&&ageIndex(age)>=0,"Invalid building footprint or age");
   const w=Number(footprint[1]),h=Number(footprint[2]);
   assert(w>=1&&h>=1&&w<=12&&h<=12,"Invalid building dimensions");
   result[kind]={name:kind,age,hp,armor,
     cost:Object.fromEntries(resources.map((k,i)=>[k,row[5+i]])),
     ms:Math.round(row[11]*1000),footprint:[w,h],
     housing:kind==="Shelter"?5:kind==="Town Center"?20:0,
     description:row[13]??""};
 }
 return result;
}
export function constructionDefinition(match,player,kind,legacy){
 return legacy[kind]??match.fullCatalog?.buildings?.[player.faction]?.[kind]??null;
}
export function allConstructionTypes(match,player,legacy){
 return {...(match.fullCatalog?.buildings?.[player.faction]??{}),...legacy};
}
