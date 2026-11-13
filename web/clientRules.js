// Shared, dependency-free UI selectors for the authoritative network inspector.
// These functions only propose commands; the host validates every order.
export const CORE_RESEARCH=Object.freeze([
 {id:"CIV-01",name:"Toolmaking",age:"I",requires:[]},
 {id:"CIV-02",name:"Organized Gathering",age:"I",requires:["CIV-01"]},
 {id:"CIV-03",name:"Permanent Settlements",age:"I",requires:["CIV-02"]},
 {id:"CIV-04",name:"Metalworking",age:"II",requires:[]},
 {id:"CIV-05",name:"Agriculture",age:"II",requires:["CIV-04"]},
 {id:"CIV-06",name:"Organized Warfare",age:"II",requires:["CIV-04"]},
 {id:"CIV-07",name:"Advanced Engineering",age:"III",requires:[]},
 {id:"CIV-08",name:"Scholarly Institutions",age:"III",requires:["CIV-07"]},
 {id:"CIV-09",name:"Complex Machinery",age:"III",requires:["CIV-07"]},
 {id:"CIV-10",name:"Industrial Production",age:"IV",requires:[]},
 {id:"CIV-11",name:"Steam Power",age:"IV",requires:["CIV-10"]},
 {id:"CIV-12",name:"Experimental Aeronautics",age:"IV",requires:["CIV-10"]}
]);
const AGE=["I","II","III","IV","V"];
export const EARLY_BUILDINGS=Object.freeze([
 {kind:"Training Camp",age:"I",cost:"100 Wood, 40 Stone"},
 {kind:"Shelter",age:"I",cost:"60 Wood"},
 {kind:"Resource Depot",age:"I",cost:"75 Wood"},
 {kind:"Barracks",age:"II",cost:"130 Wood, 60 Stone, 20 Metal"},
 {kind:"Archery Range",age:"II",cost:"130 Wood, 35 Stone, 20 Gold"},
 {kind:"Farm",age:"II",cost:"70 Wood"},
 {kind:"Forge",age:"II",cost:"120 Wood, 70 Stone, 30 Metal"}
]);
export function availableBuildings(player){
 return player?EARLY_BUILDINGS.filter(b=>AGE.indexOf(player.age)>=AGE.indexOf(b.age)):[];
}
export function chooseBuilder(player,selectedIds=[]){
 if(!player)return null;
 const chosen=new Set(selectedIds);
 return player.units.find(u=>chosen.has(u.id)&&u.alive&&u.archetype==="Worker"
  &&Number.isInteger(u.x)&&!u.garrisonedAt&&!u.embarkedAt)??null;
}
export function nextMandatoryResearch(player){
 if(!player)return null;
 const complete=new Set(player.completed??[]);
 const queued=new Set(Object.values(player.researchQueues??{}).flat()
  .map(j=>j.id));
 return CORE_RESEARCH.find(t=>t.age===player.age&&!complete.has(t.id)
  &&!queued.has(t.id)&&t.requires.every(r=>complete.has(r)))??null;
}
export function eligibleTrainingSites(player){
 if(!player)return [];
 const result=[];
 if(player.unitQueues?.["Town Center"])
  result.push({facility:"Town Center",role:"Worker",label:"Worker · Town Center"});
 for(const facility of Object.keys(player.unitQueues??{}).sort()){
  if(facility.startsWith("Training Camp#"))
   result.push({facility,role:"Club Fighter",label:"Club Fighter · "+facility});
  if(facility.startsWith("Barracks#"))
   result.push({facility,role:"Swordsman",label:"Swordsman · "+facility});
  if(facility.startsWith("Archery Range#"))
   result.push({facility,role:"Archer",label:"Archer · "+facility});
 }
 return result;
}
export function queueSummary(player){
 if(!player)return [];
 const out=[];
 for(const [facility,jobs] of Object.entries(player.researchQueues??{}))
  for(const j of jobs)out.push({facility,type:"Research",name:j.id,progressMs:j.ms});
 for(const [facility,jobs] of Object.entries(player.unitQueues??{}))
  jobs.forEach((j,index)=>out.push({facility,type:"Train",name:j.role,index,progressMs:j.ms}));
 return out;
}

/** Display catalog rows from an authenticated authoritative server response. */
export function formatCost(cost={}){
 return Object.entries(cost).filter(([,v])=>v>0)
  .map(([resource,value])=>value+" "+resource).join(", ")||"Free";
}
export function catalogBuildings(catalog){
 return (catalog?.buildings??[]).filter(b=>b.ageUnlocked);
}
export function catalogTraining(catalog){
 return (catalog?.training??[]).filter(t=>t.ageUnlocked);
}
export function catalogResearch(catalog,filter="available"){
 const rows=catalog?.research??[];
 return rows.filter(t=>filter==="all"||filter==="completed"?filter==="all"||t.completed:
  filter==="queued"?t.queued:filter==="age"?t.ageUnlocked&&!t.completed:t.available);
}
export function researchRequest(catalog,id){
 const tech=(catalog?.research??[]).find(t=>t.id===id);
 return tech?.available&&tech.facility?{facility:tech.facility,id:tech.id}:null;
}
export function trainingRequest(catalog,facility,role){
 const choice=(catalog?.training??[]).find(t=>t.facility===facility&&t.role===role);
 return choice?.available?{facility,role}:null;
}
