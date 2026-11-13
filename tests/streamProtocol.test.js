import test from "node:test";
import assert from "node:assert/strict";
import {createVersionDecoder} from "../web/streamProtocol.js";
test("version-only SSE parser handles chunk boundaries and heartbeats",()=>{
 const d=createVersionDecoder();
 assert.deepEqual(d.push("retry: 1500\nevent: ver"),[]);
 assert.deepEqual(d.push('sion\ndata: {"version":3}\n\n: heartbeat\n\n'),[3]);
 assert.deepEqual(d.push('event: version\r\ndata: {"version":4}\r\n\r\n'),[4]);
});
test("version decoder rejects private payloads and malformed input",()=>{
 const d=createVersionDecoder();
 assert.deepEqual(d.push('event: version\ndata: {"version":3,"token":"hidden"}\n\n'),[]);
 assert.deepEqual(d.push('event: version\ndata: {"version":"1"}\n\n'),[]);
 assert.deepEqual(d.push("event: version\ndata: bogus\n\n"),[]);
 assert.throws(()=>createVersionDecoder({maxBuffer:20}).push("x".repeat(21)),/too large/);
});
