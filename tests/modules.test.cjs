/* eslint-disable @typescript-eslint/no-require-imports */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const { randomUUID } = require('node:crypto');

function loader(mocks) {
  const cache = new Map();
  const load = filename => {
    filename = path.resolve(filename);
    if (cache.has(filename)) return cache.get(filename);
    const output = ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
    const loaded = { exports: {} };
    const resolve = name => {
      if (Object.hasOwn(mocks, name)) return mocks[name];
      if (name.startsWith('@/')) return load('src/' + name.slice(2) + '.ts');
      return require(name);
    };
    vm.runInThisContext('(function(require,module,exports){' + output + '\n})', { filename })(resolve, loaded, loaded.exports);
    cache.set(filename, loaded.exports); return loaded.exports;
  };
  return load;
}
function fixture() {
  const records = new Map();
  const collection = name => { if (!records.has(name)) records.set(name, []); return records.get(name); };
  const storage = {
    getRecords: async name => structuredClone(collection(name)),
    getRecord: async (name, id) => structuredClone(collection(name).find(record => record.id === id)),
    createRecord: async (name, record) => { collection(name).push(structuredClone(record)); return record; },
    updateRecord: async (name, id, updates) => { const record = collection(name).find(item => item.id === id); if (!record) return null; Object.assign(record, updates, { id }); return structuredClone(record); },
    deleteRecord: async (name, id) => { const list = collection(name); const index = list.findIndex(record => record.id === id); if (index < 0) return false; list.splice(index, 1); return true; },
    generateId: randomUUID,
    filterByProduct: (records, productId) => records.filter(record => record.productId === productId),
  };
  const load = loader({
    '@/lib/storage': storage,
    '@/lib/request-context': { getOwnedProductId: async req => req.headers.get('x-product-context') === 'workspace-a' ? 'workspace-a' : null },
    '@/lib/research': { performResearch: async (query, product, category) => ({ id: randomUUID(), query, product, category, sources: [], summary: 'Test research', insights: [], marketSize: '', competitors: [], recommendations: [], createdAt: new Date().toISOString() }), generateResearchMarkdown: record => '# ' + record.query },
  });
  return { records, storage, load, collection };
}
function req(method = 'GET', body, productId = 'workspace-a') {
  return new Request('http://localhost/api/test', { method, headers: { 'x-product-context': productId, 'Content-Type': 'application/json' }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
}
const payloads = {
  insights: { description: 'Customers find onboarding slow and confusing.', source: 'interview' },
  opportunities: { title: 'Reduce setup friction', description: 'Customers need easier setup.' },
  personas: { name: 'New customer', goals: ['Complete setup'], frustrations: ['Too many steps'] },
  interviews: { title: 'Onboarding interview', interviewee: 'Test participant', transcript: 'I find onboarding slow and confusing. I wish the setup were easier. I need clear guidance.' },
  features: { title: 'Setup checklist', framework: 'rice', scores: { reach: 5, impact: 6, confidence: 7, effort: 5 } },
  assumptions: { statement: 'Customers will complete a guided checklist.' },
  experiments: { title: 'Checklist prototype', hypothesis: 'A checklist improves completion', metrics: { successMetric: '80% complete', failureMetric: 'Less than 50% complete' } },
  research: { query: 'What makes onboarding easier?', product: 'Onboarding', category: 'product' },
};
for (const [name, payload] of Object.entries(payloads)) {
  test(name + ': create, list, ownership, delete and invalid input', async () => {
    const { load, storage } = fixture();
    const api = load('src/app/api/' + name + '/route.ts');
    assert.equal((await api.POST(req('POST', payload, 'foreign-workspace'))).status, 403);
    const invalid = await api.POST(req('POST', {})); assert.equal(invalid.status, 400);
    const response = await api.POST(req('POST', payload)); assert.equal(response.status, 201);
    const created = await response.json(); assert.equal(created.productId, 'workspace-a');
    await storage.createRecord(name + '.json', { ...created, id: 'foreign-record', productId: 'foreign-workspace' });
    const list = await (await api.GET(req())).json(); assert.equal(list.length, 1);
    const detail = load('src/app/api/' + name + '/[id]/route.ts');
    const params = { params: Promise.resolve({ id: created.id }) };
    if (detail.GET) assert.equal((await detail.GET(req(), params)).status, 200);
    assert.equal((await detail.DELETE(req('DELETE'), { params: Promise.resolve({ id: 'foreign-record' }) })).status, 404);
    assert.equal((await detail.DELETE(req('DELETE'), params)).status, 200);
    assert.equal((await (await api.GET(req())).json()).length, 0);
  });
}

test('experiment updates verify ownership and cannot move records between workspaces', async () => {
  const { load, storage } = fixture();
  await storage.createRecord('experiments.json', { id: 'owned', productId: 'workspace-a', status: 'planned' });
  await storage.createRecord('experiments.json', { id: 'foreign', productId: 'workspace-b', status: 'planned' });
  const api = load('src/app/api/experiments/[id]/route.ts');
  assert.equal((await api.PATCH(req('PATCH', { status: 'completed' }), { params: Promise.resolve({ id: 'foreign' }) })).status, 404);
  assert.equal((await api.PATCH(req('PATCH', { status: 'invalid' }), { params: Promise.resolve({ id: 'owned' }) })).status, 400);
  const response = await api.PATCH(req('PATCH', { status: 'completed', productId: 'workspace-b' }), { params: Promise.resolve({ id: 'owned' }) });
  assert.equal((await response.json()).productId, 'workspace-a');
});

test('tree auto-build uses explicit feature links and unique node IDs', () => {
  const load = loader({}); const { buildTree, flattenTree, mapTree, removeBranch, parseTree } = load('src/lib/solution-tree.ts');
  const tree = buildTree('Improve activation', [{ id: 'a', title: 'Setup friction' }, { id: 'b', title: 'Slow loading' }], [{ id: 'f', title: 'Checklist', relatedOpportunityIds: ['a'] }, { id: 'unlinked', title: 'Unlinked idea', relatedOpportunityIds: [] }], randomUUID);
  assert.equal(tree.children[0].children[0].featureId, 'f'); assert.equal(tree.children[1].children.length, 0);
  assert.equal(new Set(flattenTree(tree).map(node => node.id)).size, 4);
  assert.deepEqual(parseTree(tree), tree);
  const renamed = mapTree(tree, tree.children[0].id, node => ({ ...node, label: 'New title' }));
  assert.equal(renamed.children[0].label, 'New title'); assert.equal(tree.children[0].label, 'Setup friction');
  assert.equal(flattenTree(removeBranch(tree, tree.children[0].id)).length, 2);
  assert.throws(() => parseTree({ ...tree, children: [tree] }), /unique ID/);
  assert.throws(() => parseTree({ ...tree, label: '' }), /title/);
});

test('legacy tree root updates stay scoped and reject stale revisions', async () => {
  const records = [{ _id: 'db-a', id: 'root', productId: 'workspace-a', label: 'A', type: 'outcome', children: [], expanded: true }, { _id: 'db-b', id: 'root', productId: 'workspace-b', label: 'B', type: 'outcome', children: [], expanded: true }];
  const collection = {
    findOne: async filter => structuredClone(records.find(record => record.productId === filter.productId)),
    updateOne: async (filter, update) => { const record = records.find(record => record._id === filter._id && record.productId === filter.productId); assert.equal(filter._id, 'db-a'); Object.assign(record, update.$set); return { matchedCount: 1 }; },
  };
  const api = loader({ '@/lib/mongodb': { getDatabase: async () => ({ collection: () => collection }) }, '@/lib/request-context': { getOwnedProductId: async () => 'workspace-a' } })('src/app/api/tree/route.ts');
  const response = await api.POST(req('POST', { ...records[0], label: 'Changed' })); assert.equal(response.status, 200);
  assert.equal(records[0].label, 'Changed'); assert.equal(records[1].label, 'B');
  assert.equal((await api.POST(req('POST', { ...records[0], revision: 0 }))).status, 409);
});

test('JSON imports assign fresh IDs, normalize optional fields and remap internal links', async () => {
  const { load, collection } = fixture();
  const api = load('src/app/api/import/route.ts');
  const form = new FormData();
  form.append('file', new File([JSON.stringify({ insights: [{ id: 'old-insight', description: 'Customers struggle to finish account setup.' }], opportunities: [{ id: 'old-opp', title: 'Simplify setup', relatedInsightIds: ['old-insight'] }] })], 'evidence.json', { type: 'application/json' }));
  const response = await api.POST(new Request('http://localhost/api/import', { method: 'POST', headers: { 'x-product-context': 'workspace-a' }, body: form }));
  assert.equal(response.status, 200);
  const insight = collection('insights.json')[0]; const opportunity = collection('opportunities.json')[0];
  assert.notEqual(insight.id, 'old-insight'); assert.deepEqual(opportunity.relatedInsightIds, [insight.id]);
  assert.deepEqual(insight.tags, []); assert.equal(insight.productId, 'workspace-a');
});
test('document import rejects missing, unsupported and malformed files', async () => {
  const { load } = fixture(); const api = load('src/app/api/import/route.ts');
  for (const file of [null, new File(['binary'], 'bad.exe'), new File(['{oops'], 'bad.json')]) {
    const form = new FormData(); if (file) form.append('file', file);
    const response = await api.POST(new Request('http://localhost/api/import', { method: 'POST', headers: { 'x-product-context': 'workspace-a' }, body: form }));
    assert.equal(response.status, 400);
  }
});
test('research library only includes owned reports with unambiguous workspace IDs', async () => {
  const products = [{ id: 'a', userId: 'alice', name: 'A' }, { id: 'b', userId: 'bob', name: 'B' }, { id: 'shared-legacy', userId: 'alice', name: 'Legacy' }, { id: 'shared-legacy', userId: 'bob', name: 'Legacy' }];
  const reports = [{ id: 'r1', productId: 'a' }, { id: 'r2', productId: 'b' }, { id: 'r3', productId: 'shared-legacy' }];
  const db = { collection: name => ({
    find: filter => {
      const values = name === 'products' ? products.filter(item => item.userId === filter.userId) : reports.filter(item => filter.productId.$in.includes(item.productId));
      return { toArray: async () => values, sort: () => ({ toArray: async () => values }) };
    },
    aggregate: pipeline => ({ toArray: async () => pipeline[0].$match.id.$in.map(id => ({ _id: id, count: products.filter(product => product.id === id).length })) }),
  }) };
  const api = loader({ '@/lib/request-context': { getRequestUser: async () => ({ id: 'alice' }) }, '@/lib/mongodb': { getDatabase: async () => db } })('src/app/api/library/route.ts');
  const response = await (await api.GET(req())).json();
  assert.deepEqual(response.reports.map(report => report.id), ['r1']);
  assert.equal(response.products.length, 2);
});

test('two research workspaces keep their records isolated', async () => {
  const records = [];
  const storage = {
    getRecords: async () => structuredClone(records),
    createRecord: async (_name, record) => { records.push(structuredClone(record)); return record; },
    filterByProduct: (items, productId) => items.filter(item => item.productId === productId),
    generateId: randomUUID,
  };
  const api = loader({
    '@/lib/storage': storage,
    '@/lib/request-context': { getOwnedProductId: async request => ['research-one', 'research-two'].includes(request.headers.get('x-product-context')) ? request.headers.get('x-product-context') : null },
  })('src/app/api/insights/route.ts');
  const first = await api.POST(req('POST', { description: 'Evidence belonging only to the first research.', source: 'interview' }, 'research-one'));
  const second = await api.POST(req('POST', { description: 'Evidence belonging only to the second research.', source: 'interview' }, 'research-two'));
  assert.equal(first.status, 201); assert.equal(second.status, 201);
  const firstList = await (await api.GET(req('GET', undefined, 'research-one'))).json();
  const secondList = await (await api.GET(req('GET', undefined, 'research-two'))).json();
  assert.deepEqual(firstList.map(item => item.description), ['Evidence belonging only to the first research.']);
  assert.deepEqual(secondList.map(item => item.description), ['Evidence belonging only to the second research.']);
});

test('creating a duplicate research name returns a clear conflict', async () => {
  const products = [{ id: 'existing', userId: 'alice', name: 'Card issuance' }];
  const api = loader({
    '@/lib/storage': { getRecords: async () => products, createRecord: async (_name, record) => record },
    '@/lib/request-context': { getRequestUser: async () => ({ id: 'alice' }) },
  })('src/app/api/products/route.ts');
  const response = await api.POST(req('POST', { name: ' card ISSUANCE ' }));
  assert.equal(response.status, 409);
  assert.match((await response.json()).error, /already have a research workspace/i);
});


test('record validation accepts unclassified assumptions and rejects malformed scoring inputs', () => {
  const { validateRecordInput } = loader({})('src/lib/record-validation.ts');
  assert.equal(validateRecordInput('assumptions', { statement: 'Consent is understood', area: 'unknown' }, false), null);
  assert.ok(validateRecordInput('features', { title: 'Weighted feature', scores: { weights: { impact: 'bad' } } }, false));
  assert.ok(validateRecordInput('features', { title: ' ' }, true));
  assert.ok(validateRecordInput('experiments', { title: 'Test', risk: 'critical' }, false));
});


test('MongoDB DNS failures give a safe, actionable 503 response', async () => {
  const { databaseFailureResponse } = loader({})('src/lib/database-errors.ts');
  const failure = Object.assign(new Error('querySrv ESERVFAIL _mongodb._tcp.example.mongodb.net'), { code: 'ESERVFAIL', syscall: 'querySrv' });
  const response = databaseFailureResponse(failure);
  assert.equal(response.status, 503);
  const body = await response.json();
  assert.match(body.error, /DNS lookup failed/);
  assert.doesNotMatch(body.error, /example\.mongodb\.net/);
  assert.equal(databaseFailureResponse(new Error('Unrelated application bug')), null);
});

test('MongoDB server-selection timeouts return an actionable 503 response', async () => {
  const { databaseFailureResponse } = loader({})('src/lib/database-errors.ts');
  const failure = Object.assign(new Error('Server selection timed out'), { name: 'MongoServerSelectionError' });
  const response = databaseFailureResponse(failure);
  assert.equal(response.status, 503);
  assert.match((await response.json()).error, /within 15 seconds/);
});


test('login and workspace APIs report MongoDB DNS failures without an error page', async () => {
  const failure = Object.assign(new Error('querySrv ESERVFAIL _mongodb._tcp.example.mongodb.net'), { code: 'ESERVFAIL', syscall: 'querySrv' });
  const mocks = {
    '@/lib/storage': { getRecords: async () => { throw failure; } },
    '@/lib/request-context': { getRequestUser: async () => ({ id: 'alice' }) },
    '@/lib/auth': { adminCredentials: () => null },
  };
  const load = loader(mocks);
  const login = load('src/app/api/auth/login/route.ts');
  const loginResponse = await login.POST(req('POST', { email: 'alice@example.test', password: 'password' }));
  assert.equal(loginResponse.status, 503);
  assert.match((await loginResponse.json()).error, /DNS lookup failed/);
  const products = load('src/app/api/products/route.ts');
  const productsResponse = await products.GET(req());
  assert.equal(productsResponse.status, 503);
  assert.match((await productsResponse.json()).error, /DNS lookup failed/);
});

test('configured admin login does not depend on a database connection', async () => {
  const bcrypt = require('bcryptjs');
  const hash = await bcrypt.hash('correct-password', 4);
  let databaseRead = false;
  const login = loader({
    bcryptjs: { default: bcrypt },
    '@/lib/storage': { getRecords: async () => { databaseRead = true; throw new Error('Database should not be queried'); } },
    '@/lib/auth': {
      adminCredentials: () => ({ email: 'admin@example.test', passwordHash: hash }),
      createSessionToken: async () => 'test-session-token',
      SESSION_COOKIE: 'pda_session',
      SESSION_COOKIE_OPTIONS: { httpOnly: true, sameSite: 'lax', path: '/' },
    },
  })('src/app/api/auth/login/route.ts');
  const success = await login.POST(req('POST', { email: 'ADMIN@example.test', password: 'correct-password' }));
  assert.equal(success.status, 200);
  assert.equal((await success.json()).user.id, 'admin');
  const rejected = await login.POST(req('POST', { email: 'admin@example.test', password: 'wrong-password' }));
  assert.equal(rejected.status, 401);
  assert.equal(databaseRead, false);
});
