/* eslint-disable @typescript-eslint/no-require-imports */
// Runs real route handlers against isolated memory storage; never writes to MongoDB.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const { randomUUID } = require('node:crypto');
const { NextRequest } = require('next/server');
console.log('Import verification loaded');

function fixture() {
  const records = new Map();
  const rows = name => { if (!records.has(name)) records.set(name, []); return records.get(name); };
  const database = { collection(name) { return {
    countDocuments: async filter => rows(name).filter(row => Object.entries(filter).every(([key, value]) => row[key] === value)).length,
    find(filter) {
      let result = rows(name).filter(row => Object.entries(filter).every(([key, value]) => row[key] === value));
      return {
        sort(order) { const [key, direction] = Object.entries(order)[0]; result.sort((a, b) => a[key] < b[key] ? -direction : a[key] > b[key] ? direction : 0); return this; },
        limit(count) { result = result.slice(0, count); return this; },
        async toArray() { return structuredClone(result); },
      };
    },
  }; } };
  const mocks = {
    '@/lib/storage': {
      generateId: randomUUID,
      getRecords: async name => structuredClone(rows(name.replace(/\.json$/, ''))),
      createRecord: async (name, record) => { rows(name.replace(/\.json$/, '')).push(structuredClone(record)); return record; },
      filterByProduct: (data, id) => data.filter(row => row.productId === id),
    },
    '@/lib/mongodb': { getDatabase: async () => database },
    '@/lib/request-context': { getOwnedProductId: async req => ['import-review', 'other-review'].includes(req.headers.get('x-product-context')) ? req.headers.get('x-product-context') : null },
  };
  const cache = new Map();
  function load(filename) {
    filename = path.resolve(filename);
    if (cache.has(filename)) return cache.get(filename);
    const output = ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
    const loaded = { exports: {} };
    const resolve = name => Object.hasOwn(mocks, name) ? mocks[name] : name.startsWith('@/') ? load('src/' + name.slice(2) + '.ts') : name.startsWith('.') ? load(path.resolve(path.dirname(filename), name + '.ts')) : require(name);
    vm.runInThisContext('(function(require,module,exports){' + output + '\n})', { filename })(resolve, loaded, loaded.exports);
    cache.set(filename, loaded.exports);
    return loaded.exports;
  }
  return { rows, load };
}

(async () => {
  const { SignJWT } = await import('jose');
  const token = await new SignJWT({ name: 'Import review', email: 'import@example.test' }).setProtectedHeader({ alg: 'HS256' }).setSubject('import-review-user').setIssuedAt().setExpirationTime('1h').sign(new TextEncoder().encode('module-review-only-session-secret'));
  console.log('Launching import browser');
  const browser = await chromium.launch({ headless: true, channel: 'msedge' });
  const { rows, load } = fixture();
  const failures = [];
  let lastImport;
  try {
    console.log('Import browser ready');
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
    await context.addCookies([{ name: 'pda_session', value: token, url: 'http://localhost:3007' }]);
    await context.addInitScript(() => localStorage.setItem('active-product', 'import-review'));
    await context.route('**/*', async route => {
      const request = route.request();
      const url = new URL(request.url());
      if (url.hostname !== 'localhost') return route.abort();
      if (!url.pathname.startsWith('/api/')) return route.continue();
      try {
        if (url.pathname === '/api/auth/session') return route.fulfill({ json: { user: { id: 'import-review-user', name: 'Import review', email: 'import@example.test' } } });
        if (url.pathname === '/api/products') return route.fulfill({ json: [{ id: 'import-review', name: 'File insight review' }, { id: 'other-review', name: 'Other workspace' }] });
        if (url.pathname === '/api/library') return route.fulfill({ json: { products: [], reports: [] } });
        if (url.pathname === '/api/tree') return route.fulfill({ json: null });
        if (url.pathname === '/api/research') return route.fulfill({ json: [] });
        const name = url.pathname.split('/')[2];
        console.log('Handling ' + name);
        const handler = load('src/app/api/' + name + '/route.ts')[request.method()];
        assert.ok(handler, 'Handler exists for ' + url.pathname);
        const incoming = new NextRequest(request.url(), { method: request.method(), headers: request.headers(), ...(request.postDataBuffer() ? { body: request.postDataBuffer() } : {}) });
        const response = await handler(incoming);
        const body = await response.text();
        console.log('Handled ' + name + ': ' + response.status);
        if (name === 'import' && response.ok) lastImport = JSON.parse(body);
        return route.fulfill({ status: response.status, contentType: 'application/json', body });
      } catch (error) {
        failures.push(error.message);
        return route.fulfill({ status: 500, json: { error: error.message } });
      }
    });
    const page = await context.newPage();
    page.setDefaultTimeout(25000);
    page.setDefaultNavigationTimeout(120000);
    page.on('pageerror', error => failures.push(error.message));
    const input = () => page.getByLabel('Choose a document');
    const evidence = '# Interview\nI need a dashboard feature to export customer reports quickly.\n\n# Opportunity\nThere is an opportunity to improve reporting for small teams.\n\n# Assumption\nWe believe a guided dashboard will help customers find reports faster.\n\n# Persona\nName: Operations manager\nRole: Operations lead\nGoals:\n- Export customer reports every week\nNeeds:\n- A reliable reporting dashboard\n\n# Experiment\nTest whether guided reporting helps customers find reports faster.';
    if (!process.env.IMPORT_MOBILE_ONLY) {
    for (const modulePath of process.env.IMPORT_FLOW_ONLY ? [] : ['dashboard', 'discover', 'opportunities', 'personas', 'interviews', 'features', 'assumptions', 'experiments', 'research', 'tree', 'search']) {
      console.log('Checking ' + modulePath);
      await page.goto('http://localhost:3007/' + modulePath);
      await page.getByRole('button', { name: 'Generate from file', exact: true }).waitFor();
      assert.equal(await page.getByRole('button', { name: 'Generate from file', exact: true }).getAttribute('aria-expanded'), 'false');
      console.log('PASS file entry point: ' + modulePath);
    }
    await page.goto('http://localhost:3007/discover');
    await page.getByRole('button', { name: 'Generate from file', exact: true }).click();
    await input().setInputFiles({ name: 'customer-evidence.md', mimeType: 'text/markdown', buffer: Buffer.from(evidence) });
    await page.locator('nav a[href="/features"]').click();
    await page.waitForURL('**/features');
    await page.getByText('customer-evidence.md', { exact: true }).waitFor();
    console.log('PASS selected file survives module navigation');
    await page.getByRole('button', { name: 'Hide file insights', exact: true }).click();
    await page.getByRole('button', { name: 'Generate from file', exact: true }).click();
    await page.getByText('customer-evidence.md', { exact: true }).waitFor();
    const imported = page.waitForResponse(response => response.url().endsWith('/api/import'));
    await page.getByRole('button', { name: 'Analyze & Import', exact: true }).click();
    assert.equal((await imported).status(), 200);
    await page.getByRole('heading', { name: 'Import Results', exact: true }).waitFor();
    for (const key of ['totalInsights', 'totalOpportunities', 'totalPersonas', 'totalInterviews', 'totalFeatures', 'totalAssumptions', 'totalExperiments']) assert.ok(lastImport.summary[key] > 0, key);
    console.log('PASS actual multipart import creates all seven record types: ' + JSON.stringify(lastImport.summary));
    await page.getByRole('button', { name: 'Hide file insights', exact: true }).click();
    await page.locator('main > div').getByText(rows('features')[0].title, { exact: true }).first().waitFor();
    console.log('PASS current module refreshes with imported records');
    await page.locator('nav a[href="/dashboard"]').click();
    await page.waitForURL('**/dashboard');
    await page.getByRole('heading', { name: 'What should you learn next?' }).waitFor();
    assert.equal(await page.getByText('Discovery coverage', { exact: true }).count(), 0);
    assert.equal(await page.getByText('Recurring customer themes', { exact: true }).count(), 0);
    await page.getByText('Emerging Themes', { exact: true }).waitFor();
    await page.screenshot({ path: 'browser-import-overview-desktop.png', fullPage: true });
    console.log('PASS populated overview retains evidence summaries without redundant charts');
    await page.getByRole('button', { name: 'Switch research', exact: true }).click();
    await page.getByRole('dialog').getByRole('button', { name: /Other workspace/ }).click();
    await page.getByRole('button', { name: 'Generate from file', exact: true }).waitFor();
    await page.getByText('Start with a customer signal', { exact: true }).waitFor();
    assert.equal(rows('insights').filter(row => row.productId === 'other-review').length, 0);
    console.log('PASS switching workspace clears file state and isolates records');
    }
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('http://localhost:3007/dashboard');
    await page.reload();
    await page.getByRole('button', { name: 'Generate from file', exact: true }).click();
    await input().setInputFiles({ name: 'empty.txt', mimeType: 'text/plain', buffer: Buffer.from('') });
    await page.getByRole('button', { name: 'Analyze & Import', exact: true }).click();
    await page.getByText(/No usable evidence found/).first().waitFor();
    assert.equal(await page.getByRole('button', { name: 'Analyze & Import', exact: true }).isEnabled(), true);
    console.log('PASS empty document reports error and permits retry');
    await input().setInputFiles({ name: 'customer-research-'.repeat(12) + '.md', mimeType: 'text/markdown', buffer: Buffer.from(evidence) });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth || document.querySelector('main').scrollWidth > document.querySelector('main').clientWidth);
    await page.locator('main h1').click();
    await page.locator('main > section').first().screenshot({ path: 'browser-import-mobile.png' });
    assert.equal(await page.getByText('\\uD83D\\uDCC4', { exact: true }).count(), 0);
    assert.equal(overflow, false, 'Mobile upload must not overflow with a long filename');
    console.log('PASS mobile upload width');
    assert.deepEqual(failures, []);
    console.log('PASS no browser JavaScript or handler errors');
  } catch (error) { console.error('Import browser failed:', error); throw error; } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
