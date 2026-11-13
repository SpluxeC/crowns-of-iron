import {FACTIONS,mandatory} from "./constants.js";
import {ALL_ARCHETYPES} from "./extendedCatalog.js";
import {canonicalName,ROLE_ORDER,FACTION_STAT_MODIFIERS} from "./factionRoster.js";
import {assert,ageIndex} from "./util.js";

// Portable, browser-safe data adapter. Accepts the JSON emitted by
// scripts/import_balance.py. Never accepts definitions from client commands.
const expected={land:132,naval:48,air:36,buildings:228,research:540,upgrades:126};
const six=["Food","Wood","Stone","Metal","Gold","Aether"];
const number=(v,description)=>{assert(typeof v==="number"&&Number.isFinite(v)&&v>=0,description);return v;};
export function validateFullCatalog(data){
  assert(data&&typeof data==="object","Missing full catalog");
  for(const [key,count] of Object.entries(expected)){
    assert(Array.isArray(data[key]?.rows)&&data[key].rows.length===count,"Invalid "+key+" row count");
    assert(Array.isArray(data[key]?.columns),"Missing "+key+" headers");
  }
  for(const f of FACTIONS){
    for(const [key,count] of [["land",22],["naval",8],["air",6],["research",90]]){
      const rows=data[key].rows.filter(row=>row[0]===f);
      assert(rows.length===count,"Incomplete "+f+" "+key);
    }
  }
  const required=mandatory.map(t=>t.id);
  for(const f of FACTIONS){
    const tech=data.research.rows.filter(row=>row[0]===f);
    const ids=tech.map(row=>row[1]);
    assert(new Set(ids).size===90,"Duplicate tech for "+f);
    for(const id of required)assert(ids.includes(id),"Missing mandatory "+id);
  }
  return true;
}
function resources(row,offset){
  return Object.fromEntries(six.map((key,i)=>[key,number(row[offset+i]??0,"Invalid "+key+" price")]));
}
const nominalCategory=(role,domain)=>{
 if(domain==="air")return "Air";
 if(domain==="naval"||/Machine|Artillery|Ram|Tower|Automaton|Walker/.test(role))return "Mechanical";
 if(/Scout|Archer|Slinger|Healer|Converter|Gunner/.test(role))return "Light";
 if(/Heavy|Hero|Legendary/.test(role))return "Heavy";
 return "Standard";
};
export function installFullCatalog(match,data){
  validateFullCatalog(data);
  assert(match.elapsedMs===0&&match.tick===0,"Catalog must be installed before simulation");
  assert(!match.fullCatalog,"Catalog already installed");
  const units={},techs={};
  for(const f of FACTIONS){
    units[f]={};techs[f]={};
    for(const [domain,key] of [["land","land"],["naval","naval"],["air","air"]]){
      const rows=data[key].rows.filter(row=>row[0]===f);
      assert(rows.length===({land:22,naval:8,air:6})[key],"Malformed unit domain");
      for(let i=0;i<rows.length;i++){
        const row=rows[i],role=ROLE_ORDER[({land:0,naval:22,air:30})[domain]+i];
        assert(row[2]===role,"Incorrect role order: "+f+" "+role);
        const base=ALL_ARCHETYPES[role];
        assert(base,"No archetype for "+role);
        const hp=number(row[4],"Unit HP"),attack=number(row[5],"Unit attack");
        const armor=number(row[7],"Unit armor"),pop=number(row[10],"Unit population");
        const age=row[1];
        assert(ageIndex(age)>=0&&Number.isInteger(pop)&&pop>0,"Invalid unit age/pop");
        units[f][role]={
          ...base,age,hp,attack,armor,pop,
          cost:resources(row,11),ms:Math.round(number(row[17],"Train seconds")*1000),
          name:row[3]||canonicalName(f,role),range:number(row[8]??0,"Range"),
          intervalMs:Math.round(number(row[6]??0,"Interval")*1000),
          speed:number(row[9]??0,"Speed"),category:nominalCategory(role,domain),
          type:row[18]==="None"?(base.type??"Slash"):(row[18]||base.type),
          unique:base.unique,factionBalanced:true
        };
      }
    }
    for(const row of data.research.rows.filter(x=>x[0]===f)){
      const id=row[1],age=row[4],cost=resources(row,5);
      assert(ageIndex(age)>=0,"Research age invalid");
      const locations=String(row[13]??"").split(";").map(x=>x.trim()).filter(Boolean);
      const requires=String(row[12]??"").split(";").map(x=>x.trim()).filter(Boolean);
      assert(locations.length>0,"Research locations missing "+id);
      techs[f][id]={id,name:row[2],age,cost,ms:Math.round(number(row[11],"Research duration")*1000),
        requires,locations,exclusive:row[14]||null,effect:row[16]||""};
    }
    // Validate no unknown prerequisites and guarantee the Town Center fallback.
    for(const t of Object.values(techs[f])){
      for(const pre of t.requires)assert(techs[f][pre]&&pre!==t.id,"Unknown/cyclic direct tech dependency "+pre);
      if(t.id.startsWith("CIV-"))assert(t.locations.includes("Town Center"),"Mandatory TC fallback missing");
    }
  }
  match.fullCatalog={units,techs,revision:"reconciled-v0.2"};
  return {factions:6,unitEntries:216,techEntries:540};
}
export function unitDefinition(match,player,role){
  return match.fullCatalog?.units?.[player.faction]?.[role]??ALL_ARCHETYPES[role];
}
export function researchCatalog(match,player){
  const definitions=match.fullCatalog?.techs?.[player.faction];
  return definitions?new Map(Object.entries(definitions)):undefined;
}
