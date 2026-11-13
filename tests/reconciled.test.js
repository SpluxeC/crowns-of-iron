import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {loadReconciled,factionRoster,technologyCatalog} from "../src/reconciledData.js";
const path="data/balance-v0.2.json";
test("full reconciled workbook import is valid when local data is supplied",()=>{
 let file;try{file=readFileSync(path,"utf8")}catch(e){if(e.code==="ENOENT")return;throw e}
 assert.ok(file.length>1000);
 const data=loadReconciled(path);
 assert.equal(factionRoster(data,"Humans").length,36);
 assert.equal(technologyCatalog(data,"Ursa").size,90);
});
