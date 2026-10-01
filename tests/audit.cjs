/* Check local paths and JavaScript syntax without an external dependency. */
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const pages = fs.readdirSync(root).filter(name => name.endsWith('.html'));
let references = 0;
for (const page of pages) {
  const html = fs.readFileSync(path.join(root, page), 'utf8');
  assert.ok(html.includes('lang="en"') && html.includes('name="viewport"'), page + ': missing language or viewport');
  for (const match of html.matchAll(/(?:src|href)="([^"#]+)"/g)) {
    const target = match[1].split(/[?#]/)[0];
    if (/^(?:https?:|data:)/.test(target)) continue;
    assert.ok(fs.existsSync(path.join(root, target)), `${page}: missing ${target}`); references++;
  }
}
for (const name of fs.readdirSync(path.join(root, 'js'))) {
  const source = fs.readFileSync(path.join(root, 'js', name), 'utf8');
  new vm.Script(source, { filename: name });
  for (const match of source.matchAll(/(?:href|src)="([a-z][a-z0-9-]*\.html)(?:[?#][^"]*)?"/g)) {
    assert.ok(fs.existsSync(path.join(root, match[1])), `${name}: missing ${match[1]}`); references++;
  }
}
const context = vm.createContext({}); context.window = context;
vm.runInContext(fs.readFileSync(path.join(root, 'js/data.js'), 'utf8'), context);
for (const item of context.DLF.data.items) assert.ok(fs.existsSync(path.join(root, item.image)), `Missing illustration: ${item.image}`);
console.log(`PASS: ${pages.length} pages, ${references} local path references, 11 JavaScript files, and all sample item illustrations.`);
