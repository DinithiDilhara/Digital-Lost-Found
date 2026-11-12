import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { test } from 'node:test';
const root = new URL('../../', import.meta.url);
const read = path => readFile(new URL(path, root));

test('original stylesheets and SVG design assets remain unchanged', async () => {
  const manifest = JSON.parse(await read('frontend/original-files.sha256.json'));
  for (const [name, hash] of Object.entries(manifest).filter(([name]) => /^(css|assets)\//.test(name))) {
    const source = (await read(name)).toString();
    const hashes = [source, source.replaceAll('\r\n', '\n')].map(text => createHash('sha256').update(text).digest('hex'));
    assert.ok(hashes.includes(hash), name);
  }
});
test('React imports the original stylesheet cascade', async () => {
  const source = (await read('frontend/src/main.jsx')).toString();
  assert.deepEqual([...source.matchAll(/import ["']\.\.\/\.\.\/css\/([^"']+)["']/g)].map(match => match[1]),
    ['style.css', 'landing.css', 'auth.css', 'dashboard.css', 'responsive.css']);
});
test('all existing application URLs remain React routes', async () => {
  const source = (await read('frontend/src/App.jsx')).toString();
  for (const page of ['index', 'login', 'register', 'dashboard', 'lost-items', 'found-items', 'search', 'report-item', 'item-details', 'possible-matches', 'my-reports', 'notifications', 'messages', 'profile'])
    assert.ok(source.includes(`path="/${page}.html"`), page);
});
