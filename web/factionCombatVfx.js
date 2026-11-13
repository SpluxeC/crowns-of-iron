/** Faction-specific cosmetic combat cues; no authoritative damage semantics. */
import {factionSlug} from "./factionArt.js";
import {vehicleDomain} from "./vehicleArt.js";
const PALETTES=Object.freeze({
 humans:{muzzle:"#ffe3a0",hit:"#f2b66f",death:"#ac734b"},
 orcs:{muzzle:"#ff995b",hit:"#df7448",death:"#8c463d"},
 dwarfs:{muzzle:"#ffd47c",hit:"#efa85d",death:"#b07740"},
 "tree-elves":{muzzle:"#b7ea8b",hit:"#85bc78",death:"#5c8e63"},
 "corrupt-elves":{muzzle:"#df8cdb",hit:"#bf71bc",death:"#7b528c"},
 ursa:{muzzle:"#c7f0ff",hit:"#8bbbd5",death:"#577e9a"}
});
const OFFSETS=Object.freeze({
 air:[0,.38,.55],naval:[0,.88,.55],siege:[0,.9,.46],humanoid:[0,1.04,.34]
});
export function factionCombatVfx(descriptor,faction,role){
 if(descriptor==null)return null;
 const slug=factionSlug(faction);
 if(!slug||!PALETTES[slug]||!["muzzle","hit","death"].includes(descriptor.kind))
  throw Error("Invalid faction visual effect identity");
 const domain=vehicleDomain(role)??"humanoid",
  source=OFFSETS[domain],
  offset=descriptor.kind==="muzzle"?source:
   descriptor.kind==="hit"?[0,source[1],0]:[0,.52,0];
 return {...descriptor,color:PALETTES[slug][descriptor.kind],offset:[...offset]};
}
