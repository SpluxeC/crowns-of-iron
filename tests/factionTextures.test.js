import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {FACTION_SLUGS} from "../web/factionArt.js";
import {parsePpm,sampleFactionTexture,loadFactionTextures,textureForFaction} from "../web/factionTextures.js";
const root=new URL("../assets/textures/factions/",import.meta.url);
test("all six original faction texture maps parse as full, distinct 32x32 PPM images",async()=>{
 const signatures=new Set();
 for(const slug of FACTION_SLUGS){
  const t=parsePpm(await readFile(new URL(slug+".ppm",root),"utf8"));
  assert.equal(t.width,32);assert.equal(t.height,32);
  assert.equal(t.pixels.length,3072);
  const signature=t.pixels.slice(0,12).join(",");
  signatures.add(signature);
  assert.equal(sampleFactionTexture(t,.3,.4,.2).length,3);
 }
 assert.equal(signatures.size,6);
});
test("texture fetcher and fallback are bounded, path safe and deterministic",async()=>{
 const fetcher=async path=>({ok:true,text:()=>readFile(
  new URL(path.split("/").at(-1),root),"utf8")});
 const maps=await loadFactionTextures(fetcher);
 assert.equal(Object.keys(maps).length,6);
 assert.equal(textureForFaction(maps,"Tree Elves"),maps["tree-elves"]);
 assert.equal(textureForFaction(maps,"Unknown"),null);
 assert.deepEqual(sampleFactionTexture(null,0,0,0),[1,1,1]);
 assert.deepEqual(sampleFactionTexture(maps.ursa,1,2,3),
  sampleFactionTexture(maps.ursa,1,2,3));
});
test("PPM parser rejects malformed dimensions, excess data and invalid pixel values",()=>{
 assert.throws(()=>parsePpm("P6\n1 1\n255\n0 0 0"),/Only ASCII/);
 assert.throws(()=>parsePpm("P3\n100 1\n255\n0 0 0"),/dimensions/);
 assert.throws(()=>parsePpm("P3\n1 1\n255\n0 0"),/pixel count/);
 assert.throws(()=>parsePpm("P3\n1 1\n255\n0 500 0"),/Invalid PPM pixel/);
});
