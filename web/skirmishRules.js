/** Local-only prototype skirmish victory rules.
 * Eliminate all opposing units, or win by empire strength at the 30-minute cap.
 * This is intentionally separate from network Conquest rules. */
export const SKIRMISH_LIMIT_MS=30*60*1000;
export function skirmishScore(player){
 if(!player||!Array.isArray(player.units)||!Array.isArray(player.completed))
  throw Error("Invalid local skirmish player");
 const alive=player.units.filter(u=>u.alive);
 const military=alive.filter(u=>u.archetype!=="Worker");
 const age=["I","II","III","IV","V"].indexOf(player.age);
 const resources=Object.values(player.resources??{}).reduce(
  (a,v)=>a+(Number.isFinite(v)?Math.max(0,v):0),0);
 return Math.round(military.reduce((a,u)=>a+16+Math.max(0,u.hp/u.maxHp)*12,0)+
  (alive.length-military.length)*5+Math.max(0,age)*200+
  player.completed.length*7+
  Object.values(player.facilities??{}).reduce((a,v)=>a+Math.max(0,v)*24,0)+
  resources*.015);
}
export function applySkirmishVictory(match){
 if(!match?.players||match.players.length<2)throw Error("Invalid skirmish state");
 if(match.winner!==null)return match.winner;
 for(const player of match.players){
  if(player.units.every(u=>!u.alive)){
   player.alive=false;player.defeated=true;
  }
 }
 const surviving=match.players.filter(p=>!p.defeated);
 if(surviving.length===1){match.winner=surviving[0].id;return match.winner;}
 if(surviving.length===0){match.winner="draw";return match.winner;}
 if(match.elapsedMs>=SKIRMISH_LIMIT_MS){
  surviving.sort((a,b)=>skirmishScore(b)-skirmishScore(a)||
   a.id.localeCompare(b.id));
  match.winner=surviving[0].id;
 }
 return match.winner;
}
