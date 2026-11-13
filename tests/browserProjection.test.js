import test from "node:test";
import assert from "node:assert/strict";
import {projectTile,unprojectTile} from "../web/isometric.js";
test("isometric map projection round-trips 40x32 tile coordinates",()=>{
 for(let y=0;y<32;y++)for(let x=0;x<40;x++){
  const point=projectTile(x,y);
  assert.deepEqual(unprojectTile(point.x,point.y),{x,y});
 }
});
test("isometric projection is deterministic and keeps corner positions in viewport",()=>{
 assert.deepEqual(projectTile(0,0),{x:400,y:48});
 const far=projectTile(39,31);
 assert.ok(far.x>=0&&far.x<800&&far.y>=0&&far.y<640);
});
