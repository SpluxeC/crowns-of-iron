/** Pure, side-aware mirrored matchup diagnostics. Unresolved fixtures never count as wins. */
export function analyzeMirroredMatchups(trials,factions){
 const byPair=new Map();
 const standings=Object.fromEntries(factions.map(f=>[f,{faction:f,games:0,resolvedWins:0,resolvedLosses:0,unresolved:0,scoreLeads:0,leftWins:0,rightWins:0}]));
 for(const t of trials){
  if(!standings[t.left]||!standings[t.right]||t.left===t.right)
   throw Error("Unknown or duplicate faction in matchup");
  const key=[t.left,t.right].sort().join(" / ");
  const pair=byPair.get(key)??[];
  pair.push(t);byPair.set(key,pair);
  for(const side of [t.left,t.right]){
   const row=standings[side];row.games++;
   if(t.unresolved){row.unresolved++;if(t.leader===side)row.scoreLeads++;}
   else if(t.actualWinner===side){row.resolvedWins++;row[side===t.left?"leftWins":"rightWins"]++;}
   else row.resolvedLosses++;
  }
  if(t.unresolved ? t.actualWinner!==null : ![t.left,t.right].includes(t.actualWinner))
   throw Error("Invalid match resolution");
 }
 const pairs=[...byPair].sort(([a],[b])=>a.localeCompare(b)).map(([pair,fixtures])=>{
  const [first,second]=pair.split(" / ");
  const left=fixtures.find(t=>t.left===first&&t.right===second);
  const right=fixtures.find(t=>t.left===second&&t.right===first);
  if(fixtures.length!==2||!left||!right||left.seed!==right.seed)
   throw Error("Each pair requires two equal-seed, opposite-side fixtures: "+pair);
  const winners=fixtures.filter(t=>!t.unresolved).map(t=>t.actualWinner);
  return {pair,seed:left.seed,resolved:winners.length,unresolved:2-winners.length,
   firstWins:winners.filter(f=>f===first).length,
   secondWins:winners.filter(f=>f===second).length,
   splitDecisions:winners.length===2&&winners[0]!==winners[1]};
 });
 const rows=factions.map(f=>standings[f]);
 const decisive=rows.reduce((n,r)=>n+r.resolvedWins,0);
 return {mirroredPairs:pairs.length,trials:trials.length,resolved:decisive,
  unresolved:trials.length-decisive,
  leftWins:rows.reduce((n,r)=>n+r.leftWins,0),
  rightWins:rows.reduce((n,r)=>n+r.rightWins,0),
  splitPairs:pairs.filter(p=>p.splitDecisions).length,
  factionSummary:rows,pairs};
}
