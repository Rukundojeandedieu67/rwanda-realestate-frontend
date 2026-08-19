const test = require('node:test');
const assert = require('node:assert/strict');

const { normalizeListResponse } = require('../src/lib/api.ts');

test('normalizeListResponse handles array payloads', () => {
  assert.deepEqual(normalizeListResponse([{ id: 1 }, { id: 2 }]), [{ id: 1 }, { id: 2 }]);
});

test('normalizeListResponse handles paginated payloads', () => {
  assert.deepEqual(normalizeListResponse({ data: [{ id: 1 }, { id: 2 }] }), [{ id: 1 }, { id: 2 }]);
});
