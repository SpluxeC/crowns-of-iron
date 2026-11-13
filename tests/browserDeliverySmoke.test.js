import test from "node:test";
import assert from "node:assert/strict";
import {runBrowserDeliverySmoke} from "../src/browserDeliverySmoke.js";
test("all RTS controls, ES module imports, and authenticated stance commands deliver over HTTP",async()=>{
 const result=await runBrowserDeliverySmoke();
 assert.equal(result.htmlControls,20);
 assert.equal(result.servedModules,8);
 assert.equal(result.authenticatedBatch,true);
 assert.equal(result.anonymousRejected,true);
 assert.match(result.scope,/NOT real browser/);
});
