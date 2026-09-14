/* eslint-disable @typescript-eslint/no-require-imports */
const test = require('node:test');
const assert = require('node:assert/strict');
const ts = require('typescript');
const fs = require('node:fs');
const vm = require('node:vm');
const output = ts.transpileModule(fs.readFileSync('src/lib/analytics.ts','utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
const moduleRecord = { exports: {} };
vm.runInThisContext('(function(require,module,exports){' + output + '\n})')(require,moduleRecord,moduleRecord.exports);
const { countBy, monthlyCounts } = moduleRecord.exports;
test('monthly report counts stay in month order and exclude invalid and future dates', () => {
 const result = monthlyCounts(['2026-01-02','2026-02-15','2026-02-20','not-a-date','2027-01-01'], 3, new Date('2026-03-15T00:00:00Z'));
 assert.deepEqual(result.map(item=>item.value),[1,2,0]);
 assert.deepEqual(result.map(item=>item.label),['Jan 26','Feb 26','Mar 26']);
});
test('category counts include zero-value stages and ignore unknown values', () => {
 assert.deepEqual(countBy([{status:'planned'},{status:'planned'},{status:'unknown'}], item=>item.status, ['planned','running','completed']), [{label:'planned',value:2},{label:'running',value:0},{label:'completed',value:0}]);
});


