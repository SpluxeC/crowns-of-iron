import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {parsePpm} from "../web/factionTextures.js";
import {refineFactionTexture,roleMaterialProfile} from "../web/materialDetail.js";
test("all six refined raster textures have deterministic 128x128 pixel content",async()=>{
 const names=["humans","orcs","dwarfs","tree-elves","corrupt-elves","ursa"],signatures=new Set();
 for(const faction of names){
  const src=parsePpm(await readFile(new URL(
   "../assets/textures/factions/"+faction+".ppm",import.meta.url),"utf8"));
  const high=refineFactionTexture(src,faction);
  assert.equal(high.width,128);assert.equal(high.height,128);
  assert.equal(high.pixels.length,128*128*3);
  assert.deepEqual(high.pixels,refineFactionTexture(src,faction).pixels);
  signatures.add(high.pixels.subarray(0,16).join(","));
 }
 assert.equal(signatures.size,6);
 assert.throws(()=>refineFactionTexture(null),/Invalid/);
 assert.throws(()=>refineFactionTexture({width:100,height:100,pixels:[]}),/Invalid/);
});
test("metallic and roughness profiles distinguish six humanoid roles",()=>{
 assert.ok(roleMaterialProfile("Hero").metallicFactor>
  roleMaterialProfile("Worker").metallicFactor);
 assert.ok(roleMaterialProfile("Worker").roughnessFactor>
  roleMaterialProfile("Pikeman").roughnessFactor);
 assert.equal(roleMaterialProfile("Swordsman").roughnessFactor,.82);
});
