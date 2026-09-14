/* eslint-disable @typescript-eslint/no-require-imports */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

function load(relative, mocks) {
  const filename = path.resolve(relative);
  const output = ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const loadedModule = { exports: {} };
  const wrapper = vm.runInThisContext('(function(require,module,exports){' + output + '\n})', { filename });
  wrapper(name => Object.hasOwn(mocks, name) ? mocks[name] : require(name), loadedModule, loadedModule.exports);
  return loadedModule.exports;
}

function productsApi(records = []) {
  return load('src/app/api/products/route.ts', {
    'next/server': { NextResponse: { json: (body, options) => Response.json(body, options) } },
    '@/lib/request-context': { getRequestUser: async request => request.user },
    '@/lib/database-errors': { databaseFailureResponse: () => null },
    '@/lib/storage': {
      getRecords: async () => records,
      createRecord: async (_, record) => { records.push(record); return record; },
    },
  });
}
const request = (user, name) => ({ user: user ? { id: user } : null, json: async () => ({ name }) });

test('same workspace name across colleagues produces distinct IDs', async () => {
  const api = productsApi();
  const first = await (await api.POST(request('alice', 'Onboarding'))).json();
  const second = await (await api.POST(request('bob', 'Onboarding'))).json();
  assert.notEqual(first.id, second.id);
  assert.notEqual(first.id, first.name);
  assert.equal(first.userId, 'alice');
  assert.equal(second.userId, 'bob');
});
test('same account can reopen an existing workspace by name', async () => {
  const api = productsApi();
  const first = await (await api.POST(request('alice', 'Onboarding'))).json();
  const next = await api.POST(request('alice', ' onboarding '));
  assert.equal(next.status, 200);
  assert.equal((await next.json()).id, first.id);
});
test('workspace creation rejects unauthenticated and invalid input', async () => {
  const api = productsApi();
  assert.equal((await api.POST(request(null, 'Name'))).status, 401);
  for (const name of ['', ' ', 'a'.repeat(101), null]) assert.equal((await api.POST(request('alice', name))).status, 400);
  assert.equal((await api.POST({ user: { id: 'alice' }, json: async () => { throw Error('Invalid JSON'); } })).status, 400);
});
function contextApi(products) {
  return load('src/lib/request-context.ts', {
    '@/lib/auth': { SESSION_COOKIE: 'session', verifySession: async value => value ? { id: value } : null },
    '@/lib/mongodb': { getDatabase: async () => ({ collection: () => ({
      findOne: async query => products.find(item => item.id === query.id && item.userId === query.userId),
      countDocuments: async query => products.filter(item => item.id === query.id).length,
    }) }) },
  });
}
const contextRequest = (user, product) => ({ cookies: { get: () => ({ value: user }) }, headers: new Headers(product ? { 'x-product-context': product } : {}) });
test('ownership checks reject other accounts and missing context', async () => {
  const api = contextApi([{ id: 'unique', userId: 'alice' }]);
  assert.equal(await api.getOwnedProductId(contextRequest('alice', 'unique')), 'unique');
  assert.equal(await api.getOwnedProductId(contextRequest('bob', 'unique')), null);
  assert.equal(await api.getOwnedProductId(contextRequest('alice', null)), null);
  assert.equal(await api.getOwnedProductId(contextRequest(null, 'unique')), null);
});
test('ambiguous legacy workspace IDs fail closed for both accounts', async () => {
  const api = contextApi([{ id: 'Onboarding', userId: 'alice' }, { id: 'Onboarding', userId: 'bob' }]);
  assert.equal(await api.getOwnedProductId(contextRequest('alice', 'Onboarding')), null);
  assert.equal(await api.getOwnedProductId(contextRequest('bob', 'Onboarding')), null);
});
test('production signing requires a configured secret and secure cookies', async () => {
  const oldMode = process.env.NODE_ENV;
  const oldSecret = process.env.SESSION_SECRET;
  try {
    process.env.NODE_ENV = 'production';
    delete process.env.SESSION_SECRET;
    class SignJWT {
      setProtectedHeader() { return this; }
      setSubject() { return this; }
      setIssuedAt() { return this; }
      setExpirationTime() { return this; }
      sign() { return 'test-token'; }
    }
    const auth = load('src/lib/auth.ts', { jose: { SignJWT } });
    assert.equal(auth.SESSION_COOKIE_OPTIONS.secure, true);
    await assert.rejects(auth.createSessionToken({ id: 'alice', name: 'Alice', email: 'alice@example.test' }), /SESSION_SECRET/);
    process.env.SESSION_SECRET = 'a-test-only-secret-that-is-not-a-real-credential';
    assert.equal(await auth.createSessionToken({ id: 'alice', name: 'Alice', email: 'alice@example.test' }), 'test-token');
  } finally {
    if (oldMode === undefined) delete process.env.NODE_ENV; else process.env.NODE_ENV = oldMode;
    if (oldSecret === undefined) delete process.env.SESSION_SECRET; else process.env.SESSION_SECRET = oldSecret;
  }
});
