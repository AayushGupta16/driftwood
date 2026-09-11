import assert from 'node:assert/strict';
import test from 'node:test';
import { loadFeed } from './api.ts';
const range={start:'2026-09-01T00:00:00Z',end:'2026-09-30T00:00:00Z'};
test('a backend ignoring view=sent never presents queued messages as sent history',async()=>{
 const original=globalThis.fetch;
 globalThis.fetch=async()=>new Response(JSON.stringify({sends:[{id:'queued',status:'pending'}],total:1}));
 try {await assert.rejects(loadFeed('sent',0,range,new AbortController().signal),/does not expose sent history/);}
 finally {globalThis.fetch=original;}
});
test('approval pagination advances over system rows even though they are hidden in Inbox',async()=>{
 const original=globalThis.fetch;
 globalThis.fetch=async()=>new Response(JSON.stringify({pending:[{id:'system',kind:'bug_validation',status:'pending'}],total_pending:2}));
 try {assert.deepEqual(await loadFeed('approvals',0,range,new AbortController().signal),{rows:[],next:1});}
 finally {globalThis.fetch=original;}
});
