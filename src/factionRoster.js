// Canonical 216 unit names from the reconciled v0.2 roster workbook.
// Every faction has 22 land, 8 naval and 6 air unit identities in this exact order.
export const ROLE_ORDER=Object.freeze([
"Worker","Scout","Club Fighter","Stone Slinger","Stone Spearman","Swordsman",
"Archer","Pikeman","Raider","Heavy Infantry","Heavy Mobile","Battering Ram",
"Siege Tower","Healer","Converter","Hero","Gunner","Heavy Artillery",
"Anti-Air Infantry","Mechanized Infantry","Heavy War Machine","Legendary Land",
"Raft","Fishing Vessel","Trade Ship","Transport Ship","Light Warship",
"Heavy Warship","Naval Siege Ship","Legendary Warship",
"Scout Aircraft","Interceptor","Gunship","Bomber","Air Transport","Aerial Battleship"
]);
const names={
"Humans":`Villager|Pathfinder|Hearth Guard|Pebble Hurler|Flint Spearman|Iron Guard|Longbowman|Royal Pikeman|Cavalry Scout|Royal Guardian|Royal Knight|Crown Ram|Royal Siege Tower|Chaplain|Inquisitor|Lord Aldren|Musketeer|Royal Bombard|Sky Guard|Steam Rifle Guard|Imperial Walker|Royal Juggernaut|River Skiff|Crown Fishing Boat|Royal Trader|Crown Transport|Royal Cutter|Crown Frigate|Imperial Bombard Ship|Crown Sovereign|Royal Observer|Crown Interceptor|Royal Gunship|Imperial Bomber|Crown Sky Transport|Imperial Sky Leviathan`,
"Orcs":`Clan Laborer|Wolf Runner|Skull Brute|Rock Pitcher|Bone Pike|Warblade|Hornbow Hunter|Fang Pikeman|Warg Marauder|Iron Berserker|Dire Warg Champion|Bonebreaker Ram|Skullbreaker Tower|Blood Shaman|Spiritbinder|Gorrak Bloodfang|Smoke Gunner|Smoke Mortar|Skybreaker|Steam Legionnaire|Iron Dominion Crusher|War Mammoth|Blood Raft|River Hunter|Clan Trader|Skull Transport|War Galley|Blood Ironclad|Smoke Bombard Ship|Bloodtide Leviathan|Smoke Scout|Skull Interceptor|Ravager Gunship|Firestorm Bomber|Blood Sky Transport|Iron Dominion Sky Fortress`,
"Dwarfs":`Stonehand|Tunnel Scout|Stone Brawler|Flint Thrower|Granite Spearman|Axe Guard|Bolt Archer|Phalanx Warden|Ramcart Raider|Stone Sentinel|Runic Ram Rider|Anvil Ram|Ironclad Assault Tower|Runesmith|Rune Speaker|Thordin Ironvein|Thunder Rifleman|Forge Cannon|Air Ward Warden|Steel Ranger|Mountain Strider|Runic Colossus|Stone Float|Ironnet Fisher|Gold Barge|Iron Ferry|Steel Cutter|Mountain Frigate|Anvil Monitor|Mountainbreaker|Rune Observer|Steel Interceptor|Forge Gunship|Anvil Bomber|Dwarf Sky Carrier|Sky Mountainbreaker`,
"Tree Elves":`Grove Tender|Wind Stalker|Bark Warrior|Seed Slinger|Thorn Spear|Branch Blade|Canopy Archer|Briar Pike|Stag Rider|Ancient Warden|Great Stag Champion|Rootbreaker|Living Canopy Tower|Druid|Grove Whisperer|Sylara Windleaf|Thorncaster|Seed Bombard|Wind Hunter|Living Ironwood Ranger|Ancient Ironwood Titan|Elder Treant|Leafraft|Grove Fisher|Tidewood Merchant|Root Transport|Bough Skimmer|Ancient Barkship|Thorn Bombard Ship|Tidewood Ancient|Windglider|Canopy Interceptor|Thorn Gunship|Seedstorm Bomber|Root Sky Carrier|Worldtree Skywarden`,
"Corrupt Elves":`Shade Servitor|Dusk Seeker|Gloom Fighter|Shade Slinger|Dusk Spear|Nightblade|Shade Archer|Obsidian Pike|Shade Strider|Umbral Guard|Void Steed Rider|Void Ram|Umbral Assault Spire|Hexcaster|Mind Hexer|Vaelith Nightshade|Void Repeater|Eclipse Cannon|Void Flak|Void Automaton|Shadow Juggernaut|Eclipse Avatar|Shade Skiff|Night Fisher|Umbral Trader|Void Transport|Shade Cutter|Obsidian Frigate|Eclipse Bombard Ship|Eclipse Dreadnought|Shade Observer|Eclipse Interceptor|Void Gunship|Umbral Bomber|Shadow Sky Carrier|Nightfall Sky Fortress`,
"Ursa":`Clan Forager|Snow Tracker|Paw Brawler|Ice Pebble Hurler|Ironwood Spear|Clawblade|Frostbow Hunter|Great Spear Guard|Snowfang Rider|Bear Guard|War Mammoth Rider|Greatclaw Ram|Greatclaw Siege Tower|Spiritcaller|Ancestor Herald|Torvak Stonepaw|Ironwood Rifleman|Boulder Cannon|Skyclaw Gunner|Ironwood Juggernaut|Ursan Colossus|Great Ursarch|Ironwood Raft|Icewater Fisher|Clan Merchant|Great Ferry|Claw Cutter|Frost Ironclad|Winter Siege Ship|Great Ursaship|Skyclaw Scout|Snow Interceptor|Greatclaw Gunship|Winter Bomber|Great Sky Carrier|First Den Sky Fortress`
};
export const CANONICAL_NAMES=Object.freeze(Object.fromEntries(
  Object.entries(names).map(([f,s])=>[f,Object.freeze(s.split("|"))])
));
export const FACTION_STAT_MODIFIERS=Object.freeze({
"Humans":Object.freeze({hp:1,attack:1,speed:1,armor:0}),
"Orcs":Object.freeze({hp:1,attack:1.002,speed:.98,armor:0}),
"Dwarfs":Object.freeze({hp:1.015,attack:.98,speed:.93,armor:1}),
"Tree Elves":Object.freeze({hp:.99,attack:1.005,speed:1.05,armor:0}),
"Corrupt Elves":Object.freeze({hp:.98,attack:1.01,speed:1.03,armor:0}),
"Ursa":Object.freeze({hp:1.025,attack:.973,speed:.93,armor:1})
});
export function canonicalName(faction,role){
 const idx=ROLE_ORDER.indexOf(role);
 return idx<0?null:(CANONICAL_NAMES[faction]?.[idx]??null);
}
export function validateCanonicalRoster(){
 if(ROLE_ORDER.length!==36||Object.keys(CANONICAL_NAMES).length!==6)
   throw new Error("Roster shape mismatch");
 for(const [f,names] of Object.entries(CANONICAL_NAMES)){
   if(names.length!==36||new Set(names).size!==36)throw new Error("Invalid roster for "+f);
 }
 return {factions:6,land:132,naval:48,air:36,total:216};
}
