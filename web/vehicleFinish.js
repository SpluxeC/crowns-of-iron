/** Six deterministic faction paint recipes for supplemental vehicle components.
 * This modifies only attachment vertex colors, not gameplay/team identification. */
export const VEHICLE_FINISH=Object.freeze({
 humans:{metal:[.77,.80,.88],trim:[.82,.61,.30],wood:[.49,.34,.23]},
 orcs:{metal:[.54,.63,.48],trim:[.78,.33,.20],wood:[.35,.29,.20]},
 dwarfs:{metal:[.77,.67,.48],trim:[.89,.56,.23],wood:[.53,.36,.23]},
 "tree-elves":{metal:[.55,.73,.54],trim:[.78,.85,.43],wood:[.42,.56,.32]},
 "corrupt-elves":{metal:[.56,.43,.67],trim:[.77,.24,.50],wood:[.29,.25,.38]},
 ursa:{metal:[.61,.71,.75],trim:[.80,.83,.91],wood:[.43,.38,.35]}
});
const clamp=x=>Math.max(0,Math.min(1,x));
export function finishVehicleComponent(component,faction,kind="metal"){
 const finish=VEHICLE_FINISH[faction];
 if(!finish||!component||!Array.isArray(component.colors)||
  component.colors.length%4!==0||!["metal","trim","wood"].includes(kind))
  throw Error("Invalid faction vehicle finish");
 const palette=finish[kind],colors=component.colors;
 for(let i=0;i<colors.length;i+=4){
  if(![0,1,2,3].every(k=>Number.isFinite(colors[i+k])))
   throw Error("Non-finite vehicle color");
  const light=(colors[i]+colors[i+1]+colors[i+2])/3;
  // Retain local lightness and highlights while clearly separating faction finishes.
  const intensity=.65+.4*light;
  for(let k=0;k<3;k++)colors[i+k]=clamp(palette[k]*intensity);
  colors[i+3]=1;
 }
 return component;
}
export function finishVehicleAssembly(component,accessories,faction){
 finishVehicleComponent(component,faction,"metal");
 for(let i=0;i<accessories.length;i++)
  finishVehicleComponent(accessories[i],faction,i===0?"wood":"trim");
 return {component,accessories};
}
