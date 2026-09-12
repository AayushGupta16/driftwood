import assert from 'node:assert/strict';
import test from 'node:test';
import { audienceSource, type AudienceSummary } from './model.ts';
import { saveAudienceTags } from './api.ts';

const audience: AudienceSummary = { id: 'a', name: 'QA leaders', description: '', sourceProvider: 'orange_slice', memberCount: 2, createdAt: '', updatedAt: '' };
test('a discovery provider alone does not imply campaign or curated provenance', () => {
  assert.equal(audienceSource(audience), 'other');
  assert.equal(audienceSource({...audience, sourceProvider: 'csv_upload'}), 'uploaded');
  assert.equal(audienceSource({...audience, sourceKind: 'campaign'}), 'campaign');
  assert.equal(audienceSource({...audience, sourceKind: 'curated'}), 'curated');
});
test('tag edits do not report success when an older backend silently ignores tags', async () => {
  const fetchBefore = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({id:'a', name:'QA leaders'}));
  try { await assert.rejects(saveAudienceTags('a', ['Priority']), /Tags were not saved/); }
  finally { globalThis.fetch = fetchBefore; }
});
