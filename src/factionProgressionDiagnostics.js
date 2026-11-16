/** Pure age/army/economy progression analysis for mirrored headless fixtures.
 * Observations remain descriptive: no wins are inferred from army size. */
const AGE={I:1,II:2,III:3,IV:4,V:5};
export function analyzeFactionProgression(trials,factions){
 const rows=Object.fromEntries(factions.map(f=>[f,{
  faction:f,observations:0,armyTotal:0,workersTotal:0,techTotal:0,
  constructionTotal:0,highestAge:1,ageIIObservations:0,
  fixturesObserved:0,fixturesWithAgeII:0,firstObservedAgeIISecondsTotal:0
 }]));
 const byTime=new Map();
 for(const trial of trials){
  if(!rows[trial.left]||!rows[trial.right]||trial.left===trial.right)
   throw Error("Unknown faction in progression fixture");
  let prior=0;
  const firstAgeII=[null,null];
  for(const checkpoint of trial.checkpoints??[]){
   if(!Number.isInteger(checkpoint.second)||checkpoint.second<=prior||
      checkpoint.second>trial.ticks||checkpoint.second%120!==0||
      checkpoint.players?.length!==2)
    throw Error("Invalid progression checkpoint");
   prior=checkpoint.second;
   for(let i=0;i<2;i++){
    const faction=i===0?trial.left:trial.right;
    const point=checkpoint.players[i];
    if(point.faction!==faction||!(point.age in AGE)||![
     point.activeArmy,point.activeWorkers,point.completedTech,
     point.completedConstruction].every(v=>Number.isInteger(v)&&v>=0))
     throw Error("Malformed progression snapshot");
    const r=rows[faction];r.observations++;
    r.armyTotal+=point.activeArmy;r.workersTotal+=point.activeWorkers;
    r.techTotal+=point.completedTech;r.constructionTotal+=point.completedConstruction;
    r.highestAge=Math.max(r.highestAge,AGE[point.age]);
    if(AGE[point.age]>=2){
     r.ageIIObservations++;
     if(firstAgeII[i]===null)firstAgeII[i]=checkpoint.second;
    }
    const key=faction+"|"+checkpoint.second;
    const aggregate=byTime.get(key)??{faction,second:checkpoint.second,n:0,army:0,workers:0,tech:0};
    aggregate.n++;aggregate.army+=point.activeArmy;
    aggregate.workers+=point.activeWorkers;aggregate.tech+=point.completedTech;
    byTime.set(key,aggregate);
   }
  }
 }
 const round=(total,n)=>n?Math.round(total/n*100)/100:null;
 return {
  factions:factions.map(f=>{
   const r=rows[f];return {faction:f,observations:r.observations,
    meanArmy:round(r.armyTotal,r.observations),
    meanWorkers:round(r.workersTotal,r.observations),
    meanTech:round(r.techTotal,r.observations),
    meanConstructions:round(r.constructionTotal,r.observations),
    highestAgeReached:Object.keys(AGE).find(age=>AGE[age]===r.highestAge),
    ageIIObservationShare:round(r.ageIIObservations,r.observations),
    fixturesObserved:r.fixturesObserved,fixturesWithAgeII:r.fixturesWithAgeII,
    meanFirstObservedAgeIISeconds:round(r.firstObservedAgeIISecondsTotal,r.fixturesWithAgeII)};
  }),
  timeline:[...byTime.values()].map(r=>({
   faction:r.faction,second:r.second,samples:r.n,
   meanArmy:round(r.army,r.n),meanWorkers:round(r.workers,r.n),
   meanTech:round(r.tech,r.n)
  })).sort((a,b)=>a.second-b.second||a.faction.localeCompare(b.faction))
 };
}
