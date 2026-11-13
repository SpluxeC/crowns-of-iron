import {RESOURCES} from "./constants.js";
import {assert,spend} from "./util.js";
import {researchMultiplier} from "./technologyEffects.js";
const RATES=Object.freeze({Food:.75,Wood:.65,Stone:.48,Metal:.38,Gold:.37,Aether:.18});
export function gather(player,deltaMs,{farmWorkers=0,foresterWorkers=0,materialPlants=0,materialChoice="Stone",condensers=0}={}){
  assert(Number.isSafeInteger(deltaMs)&&deltaMs>=0,"Invalid interval");
  assert(Number.isSafeInteger(farmWorkers)&&farmWorkers>=0&&farmWorkers<=player.workers.Food,"Invalid farm assignment");
  assert(Number.isSafeInteger(foresterWorkers)&&foresterWorkers>=0&&foresterWorkers<=player.workers.Wood,"Invalid forester assignment");
  assert(Number.isSafeInteger(materialPlants)&&materialPlants>=0&&materialPlants<=3,"Invalid recovery plant count");
  assert(["Stone","Metal"].includes(materialChoice),"Invalid recovery target");
  assert(Number.isSafeInteger(condensers)&&condensers>=0&&condensers<=2,"Invalid condenser count");
  // If a recovery facility cannot afford upkeep, it shuts off for this tick.
  // Preflight before any ordinary gathering to avoid partially-mutated state.
  if(deltaMs>0&&(materialPlants||condensers)){
    const predictedGold=Math.ceil(player.workerUpkeepRemainder.Gold+(materialPlants*.06+condensers*.08)*deltaMs/1000-1e-10);
    const predictedFood=Math.ceil(player.workerUpkeepRemainder.Food+materialPlants*.04*deltaMs/1000-1e-10);
    if(player.resources.Gold<predictedGold||player.resources.Food<predictedFood){
      materialPlants=0;condensers=0;
    }
  }
  const enabled={"Food":true,"Wood":true,"Stone":true,"Metal":player.age!=="I","Gold":true,"Aether":["III","IV","V"].includes(player.age)};
  for(const k of RESOURCES){
    let amount=(enabled[k]?player.workers[k]*RATES[k]*researchMultiplier(player,"gather",{resource:k})*deltaMs/1000:0);
    if(k==="Food")amount+=farmWorkers*(.7-RATES.Food)*deltaMs/1000;
    if(k===materialChoice&&player.age==="V")amount+=materialPlants*(k==="Stone"?.3:.2)*deltaMs/1000;
    if(k==="Aether"&&player.age==="V")amount+=condensers*.08*deltaMs/1000;
    const combined=(player.workerIncomeRemainder[k]??0)+amount;
    const deposit=Math.floor(combined+1e-10);
    player.resources[k]+=deposit;
    player.workerIncomeRemainder[k]=combined-deposit;
  }
  // Explicit active recovery requires upkeep; never free Stone/Metal/Aether.
  if(deltaMs>0&&(materialPlants||condensers)){
    const goldExact=player.workerUpkeepRemainder.Gold+(materialPlants*.06+condensers*.08)*deltaMs/1000;
    const foodExact=player.workerUpkeepRemainder.Food+materialPlants*.04*deltaMs/1000;
    const goldCost=Math.floor(goldExact+1e-10), foodCost=Math.floor(foodExact+1e-10);
    if(goldCost||foodCost)spend(player.resources,{Gold:goldCost,Food:foodCost});
    player.workerUpkeepRemainder.Gold=goldExact-goldCost;
    player.workerUpkeepRemainder.Food=foodExact-foodCost;
  }
}
export function transfer(from,to,cost){
  assert(from!==to,"Must transfer between players");
  spend(from.resources,cost);
  for(const k of RESOURCES)to.resources[k]+=(cost[k]??0);
}
export function addIncome(player,cost){
  for(const [k,v] of Object.entries(cost)) {
    assert(RESOURCES.includes(k)&&Number.isSafeInteger(v)&&v>=0,"Invalid income");
    player.resources[k]+=v;
  }
}
