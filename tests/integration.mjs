// Real HTTP + MySQL regression test. Requires a migrated test database.
// Creates uniquely named test users and leaves one lost/found report for restart inspection.
import assert from 'node:assert/strict';
import { spawn, execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { once } from 'node:events';
import { resolve } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';

const root = resolve(import.meta.dirname, '..');
const config = process.env.DLF_ENV_FILE || '.env';
const env = { ...process.env };
for (const line of readFileSync(resolve(root, config), 'utf8').split(/\r?\n/)) {
  const match = line.match(/^(DB_URL|DB_USER|DB_PASSWORD)=(.*)$/);
  if (match) env[match[1]] = match[2];
}
assert.ok(env.DB_USER && env.DB_PASSWORD, 'Configure database credentials locally before integration testing.');
const port = process.env.DLF_TEST_PORT || '15000';
env.PORT = port;
const base = `http://127.0.0.1:${port}/api`;
const db = new URL(env.DB_URL.replace(/^jdbc:/, ''));
const mysql = process.env.MYSQL_EXE || 'C:/Program Files/MySQL/MySQL Server 8.0/bin/mysql.exe';
const java = process.env.JAVA_HOME ? resolve(process.env.JAVA_HOME, 'bin/java.exe') : 'java';
const jar = resolve(root, 'backend/target/digital-lost-found-backend-1.0-SNAPSHOT.jar');
const sql = statement => execFileSync(mysql, ['--protocol=TCP', `--host=${db.hostname}`, `--port=${db.port || '3306'}`, `--user=${env.DB_USER}`, `--database=${db.pathname.slice(1)}`, '--batch', '--skip-column-names', '--execute', statement], {
  env: { ...env, MYSQL_PWD: env.DB_PASSWORD }, encoding: 'utf8', windowsHide: true,
}).trim();
let server;
let log = '';
let assertions = 0;
const checks = [];
function passed(message) { assertions++; checks.push(message); console.log(`PASS ${message}`); }
async function start() {
  // Never terminate or reuse another person's backend.
  try { await fetch(`${base}/health`, { signal: AbortSignal.timeout(500) }); throw new Error(`Port ${port} is already in use; set DLF_TEST_PORT to another port.`); }
  catch (error) { if (!['TypeError', 'TimeoutError'].includes(error.name)) throw error; }
  server = spawn(java, ['-jar', jar], { cwd: root, env, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
  server.stdout.on('data', chunk => { log += chunk; });
  server.stderr.on('data', chunk => { log += chunk; });
  for (let tries = 0; tries < 80; tries++) {
    if (server.exitCode !== null) throw new Error(`Java exited: ${log}`);
    try { if ((await fetch(`${base}/health`)).ok) return; } catch {}
    await delay(250);
  }
  throw new Error(`Backend did not start: ${log}`);
}
async function stop() {
  if (server && server.exitCode === null) { const exit = once(server, 'exit'); server.kill(); await exit; }
}
function client() {
  let cookie = '';
  return {
    get cookie() { return cookie; },
    set cookie(value) { cookie = value; },
    async call(path, { method = 'GET', body, key, headers = {} } = {}, expected = 200) {
      const response = await fetch(base + path, { method, headers: {
        ...(cookie ? { Cookie: cookie } : {}), ...(method === 'GET' ? {} : { 'X-DLF-Request': '1' }),
        ...(body === undefined ? {} : { 'Content-Type': 'application/json' }), ...(key ? { 'Idempotency-Key': key } : {}), ...headers,
      }, ...(body === undefined ? {} : { body: typeof body === 'string' ? body : JSON.stringify(body) }) });
      const newCookie = response.headers.get('set-cookie');
      if (newCookie) cookie = newCookie.split(';')[0];
      const value = response.status === 204 ? null : await response.json();
      assert.equal(response.status, expected, `${method} ${path}: ${JSON.stringify(value)}`);
      return value;
    },
  };
}
const a = client(), b = client(), anonymous = client();
const unique = Date.now();
const accountA = { name: 'Integration Student A', registration: 'EG/TEST/A', email: `integration-a-${unique}@example.edu`, password: 'Integration-only-9x!' };
const accountB = { ...accountA, name: 'Integration Student B', registration: 'EG/TEST/B', email: `integration-b-${unique}@example.edu` };
const accountC = { ...accountA, name: 'Integration Student C', registration: 'EG/TEST/C', email: `integration-c-${unique}@example.edu` };
const report = { title: `Lost calculator ${unique}`, description: 'Black scientific calculator with a scratch on the cover.', category: 'Electronics', color: 'Black', location: 'Engineering Library', dateLost: '2026-10-01', contact: 'Private owner contact', image: 'assets/images/calculator.svg' };
let lost, found, userA, userB, userC, conversationId, firstMessage;
try {
  await start();
  await a.call('/health/db'); passed('Java readiness confirms migrated MySQL schema');
  userA = await a.call('/auth/register', { method: 'POST', body: accountA }, 201);
  userB = await b.call('/auth/register', { method: 'POST', body: accountB }, 201);
  userC = await anonymous.call('/auth/register', { method: 'POST', body: accountC }, 201);
  await a.call('/auth/register', { method: 'POST', body: accountA }, 409);
  assert.ok(!JSON.stringify(userA).includes('password'));
  passed('two users register in MySQL; duplicate email rejected; hashes never returned');
  await a.call('/auth/login', { method: 'POST', body: { ...accountA, password: 'wrong' } }, 401);
  await a.call('/auth/login', { method: 'POST', body: accountA });
  assert.equal((await a.call('/auth/me')).id, userA.id);
  assert.ok(sql(`SELECT password_hash FROM users WHERE user_id=${Number(userA.id)}`).startsWith('pbkdf2-sha256$'));
  passed('real password validation and database-backed session');
  await anonymous.call('/lost-items', { method: 'POST', body: report, key: crypto.randomUUID() }, 401);
  const key = crypto.randomUUID();
  lost = await a.call('/lost-items', { method: 'POST', body: { ...report, userId: Number(userB.id) }, key }, 201);
  assert.equal(lost.userId, Number(userA.id)); assert.ok(lost.itemId > 0);
  assert.equal(sql(`SELECT title FROM lost_items WHERE item_id=${lost.itemId}`), report.title);
  assert.equal(sql(`SELECT COUNT(*) FROM lost_items WHERE user_id=${Number(userA.id)}`), '1');
  passed('lost report saved in MySQL with server-derived owner and generated ID');
  const duplicate = await a.call('/lost-items', { method: 'POST', body: report, key });
  assert.equal(duplicate.itemId, lost.itemId);
  await a.call('/lost-items', { method: 'POST', body: { ...report, title: 'different' }, key }, 409);
  assert.equal(sql(`SELECT COUNT(*) FROM lost_items WHERE user_id=${Number(userA.id)}`), '1');
  passed('retry deduplication and changed-payload conflict');
  assert.ok((await a.call('/me/reports')).lost.some(item => item.itemId === lost.itemId));
  assert.ok((await anonymous.call('/lost-items')).some(item => item.itemId === lost.itemId));
  assert.ok(!(await anonymous.call(`/lost-items/${lost.itemId}`)).contact);
  assert.equal((await a.call(`/lost-items/${lost.itemId}`)).contact, report.contact);
  passed('My Reports, public listing and details agree; private contact stays private');
  const revoked = a.cookie;
  await a.call('/auth/logout', { method: 'POST' }, 204);
  a.cookie = revoked; await a.call('/auth/me', {}, 401);
  await b.call('/auth/login', { method: 'POST', body: accountB });
  assert.ok((await b.call('/lost-items')).some(item => item.itemId === lost.itemId));
  assert.equal((await b.call(`/lost-items/${lost.itemId}`)).title, report.title);
  assert.equal((await b.call('/me/reports')).lost.length, 0);
  for (const method of ['PUT', 'DELETE', 'PATCH'])
    await b.call(`/lost-items/${lost.itemId}`, { method, body: method === 'DELETE' ? undefined : { ...report, userId: Number(userA.id), status: 'RESOLVED' } }, 403);
  passed('logout revokes sessions; Student B sees A report but cannot edit/delete/change status');
  await a.call('/auth/login', { method: 'POST', body: accountA });
  await a.call(`/lost-items/${lost.itemId}`, { method: 'PUT', body: { ...report, description: 'Updated calculator description', userId: Number(userB.id) } });
  assert.equal(sql(`SELECT user_id FROM lost_items WHERE item_id=${lost.itemId}`), userA.id);
  await a.call(`/lost-items/${lost.itemId}`, { method: 'PATCH', body: { status: 'RESOLVED' } });
  assert.equal(sql(`SELECT status FROM lost_items WHERE item_id=${lost.itemId}`), 'RESOLVED');
  await a.call(`/lost-items/${lost.itemId}`, { method: 'PATCH', body: { status: 'Open' } });
  passed('owner edits and status changes persist without transferring ownership');
  const foundReport = { ...report, title: `Found calculator ${unique}`, dateFound: '2026-10-02' };
  found = await a.call('/found-items', { method: 'POST', body: foundReport, key: crypto.randomUUID() }, 201);
  assert.equal(sql(`SELECT title FROM found_items WHERE item_id=${found.itemId}`), foundReport.title);
  assert.ok((await b.call('/found-items')).some(item => item.itemId === found.itemId));
  assert.equal((await b.call(`/found-items/${found.itemId}`)).title, foundReport.title);
  for (const method of ['PUT', 'DELETE', 'PATCH'])
    await b.call(`/found-items/${found.itemId}`, { method, body: method === 'DELETE' ? undefined : { ...foundReport, status: 'RETURNED' } }, 403);
  await a.call(`/found-items/${found.itemId}`, { method: 'PATCH', body: { status: 'RETURNED' } });
  assert.equal(sql(`SELECT status FROM found_items WHERE item_id=${found.itemId}`), 'RETURNED');
  await a.call(`/found-items/${found.itemId}`, { method: 'PATCH', body: { status: 'Open' } });
  passed('found reports share correctly and enforce the same ownership rules');
  const firstContactKey = crypto.randomUUID();
  firstMessage = await b.call('/conversations', {
    method: 'POST',
    body: { itemType: 'found', itemId: found.itemId, message: 'Could you share more information about this item?' },
    key: firstContactKey,
  });
  conversationId = firstMessage.conversationId;
  assert.equal(sql(`SELECT reporter_id FROM conversations WHERE conversation_id=${conversationId}`), userA.id);
  assert.equal(sql(`SELECT requester_id FROM conversations WHERE conversation_id=${conversationId}`), userB.id);
  assert.equal(sql(`SELECT COUNT(*) FROM messages WHERE conversation_id=${conversationId}`), '1');
  const bConversations = await b.call('/conversations');
  const aConversations = await a.call('/conversations');
  assert.ok(bConversations.some(row => row.id === conversationId && row.itemId === found.itemId));
  assert.ok(aConversations.some(row => row.id === conversationId && row.itemTitle === foundReport.title));
  passed('Student B starts a found-item conversation delivered only to Student A, with item/reporters stored in MySQL');
  const repeatedStart = await b.call('/conversations', {
    method: 'POST',
    body: { itemType: 'found', itemId: found.itemId, message: 'Could you share more information about this item?' },
    key: firstContactKey,
  });
  assert.equal(repeatedStart.conversationId, conversationId);
  assert.equal(sql(`SELECT COUNT(*) FROM conversations WHERE found_item_id=${found.itemId} AND requester_id=${userB.id}`), '1');
  assert.equal(sql(`SELECT COUNT(*) FROM messages WHERE conversation_id=${conversationId}`), '1');
  passed('retry uses same conversation and idempotency key without duplicate thread or message');
  const incoming = await a.call(`/conversations/${conversationId}/messages`);
  assert.equal(incoming.length, 1);
  assert.equal(incoming[0].senderId, userB.id);
  assert.equal(incoming[0].body, 'Could you share more information about this item?');
  assert.equal((await a.call(`/conversations/${conversationId}/read`, { method: 'POST', body: {} })).updated, 1);
  assert.equal(sql(`SELECT COUNT(*) FROM messages WHERE conversation_id=${conversationId} AND read_at IS NOT NULL`), '1');
  const replyKey = crypto.randomUUID();
  await a.call(`/conversations/${conversationId}/messages`, {
    method: 'POST',
    body: { message: 'The label has my initials on the back.' },
    key: replyKey,
  }, 201);
  const reply = await b.call(`/conversations/${conversationId}/messages`);
  assert.equal(reply.length, 2);
  assert.equal(reply[1].senderId, userA.id);
  assert.equal(reply[1].body, 'The label has my initials on the back.');
  assert.equal((await b.call('/conversations/unread-count')).count, 1);
  passed('Student A reads and replies; Student B receives the stored reply and unread count');
  await anonymous.call(`/conversations/${conversationId}/messages`, {}, 401);
  await anonymous.call('/conversations', {}, 401);
  await anonymous.call(`/conversations/${conversationId}/messages`, {
    method: 'POST', body: { message: 'Unauthorized message.' }, key: crypto.randomUUID(),
  }, 401);
  await anonymous.call('/auth/login', { method: 'POST', body: accountC });
  await anonymous.call(`/conversations/${conversationId}/messages`, {}, 404);
  await anonymous.call(`/conversations/${conversationId}/read`, { method: 'POST', body: {} }, 404);
  await anonymous.call(`/conversations/${conversationId}/messages`, {
    method: 'POST', body: { message: 'Student C must not reply.' }, key: crypto.randomUUID(),
  }, 404);
  assert.ok(!(await anonymous.call('/conversations')).some(row => row.id === conversationId));
  passed('anonymous requests are rejected and Student C cannot list, read, mark read, or reply to A/B conversation');
  const futureParts = new Intl.DateTimeFormat('en', {
    timeZone: 'Asia/Colombo', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(new Date(Date.now() + 86400000));
  const futureDate = Object.fromEntries(futureParts.map(part => [part.type, part.value]));
  const future = `${futureDate.year}-${futureDate.month}-${futureDate.day}`;
  const futureResult = await a.call('/lost-items', {
    method: 'POST',
    body: { ...report, dateLost: future },
    key: crypto.randomUUID(),
  }, 400);
  assert.match(futureResult.error, /future.*Sri Lanka time/i);
  passed('backend rejects future lost report date using Sri Lanka time');
  const concurrentKey = crypto.randomUUID();
  const concurrent = await Promise.all(Array.from({ length: 3 }, async () => {
    const response = await fetch(base + '/found-items', { method: 'POST', headers: { Cookie: a.cookie, 'X-DLF-Request': '1', 'Content-Type': 'application/json', 'Idempotency-Key': concurrentKey }, body: JSON.stringify({ ...foundReport, title: 'Concurrent retry test' }) });
    assert.ok([200, 201].includes(response.status)); return response.json();
  }));
  assert.equal(new Set(concurrent.map(item => item.itemId)).size, 1);
  await a.call(`/found-items/${concurrent[0].itemId}`, { method: 'DELETE' }, 204);
  await a.call(`/found-items/${concurrent[0].itemId}`, {}, 404);
  assert.equal(sql(`SELECT COUNT(*) FROM found_items WHERE item_id=${concurrent[0].itemId}`), '0');
  passed('simultaneous duplicate requests create one row; owner deletion removes it');
  await a.call('/lost-items', { method: 'POST', body: { ...report, dateLost: '2026-02-30' }, key: crypto.randomUUID() }, 400);
  await a.call('/lost-items', { method: 'POST', body: { ...report, title: '' }, key: crypto.randomUUID() }, 400);
  await a.call('/lost-items', { method: 'POST', body: '[broken', key: crypto.randomUUID() }, 400);
  await a.call('/lost-items', { method: 'POST', body: report, key: crypto.randomUUID(), headers: { 'X-DLF-Request': '' } }, 403);
  passed('invalid dates, required fields, malformed JSON and CSRF requests rejected');
  const refresh = client(); refresh.cookie = b.cookie;
  assert.equal((await refresh.call('/auth/me')).id, userB.id);
  await stop(); await start();
  assert.equal((await refresh.call('/auth/me')).id, userB.id);
  assert.equal((await refresh.call(`/lost-items/${lost.itemId}`)).itemId, lost.itemId);
  assert.equal((await refresh.call(`/found-items/${found.itemId}`)).itemId, found.itemId);
  const afterRestart = await refresh.call(`/conversations/${conversationId}/messages`);
  assert.equal(afterRestart.length, 2);
  assert.equal(afterRestart[1].body, 'The label has my initials on the back.');
  assert.ok((await a.call('/conversations')).some(row => row.id === conversationId));
  assert.equal(sql(`SELECT COUNT(*) FROM messages WHERE conversation_id=${conversationId}`), '2');
  passed('fresh client and backend restart retain MySQL reports, messages and valid sessions');
  await a.call('/auth/me', { method: 'PUT', body: { ...accountA, name: 'Updated Integration Student A' } });
  await a.call('/auth/password', { method: 'PUT', body: { currentPassword: 'wrong', newPassword: 'Changed-test-9x!' } }, 400);
  await a.call('/auth/password', { method: 'PUT', body: { currentPassword: accountA.password, newPassword: 'Changed-test-9x!' } }, 204);
  await a.call('/auth/login', { method: 'POST', body: accountA }, 401);
  await a.call('/auth/login', { method: 'POST', body: { ...accountA, password: 'Changed-test-9x!' } });
  passed('profile and password changes persist and enforce current password');
  mkdirSync(resolve(root, '.local'), { recursive: true });
  writeFileSync(resolve(root, '.local/integration-results.json'), JSON.stringify({ timestamp: new Date().toISOString(), database: `${db.hostname}:${db.port}${db.pathname}`, assertions, checks, reportIds: { lost: lost.itemId, found: found.itemId }, accounts: { a: accountA.email, b: accountB.email } }, null, 2));
  console.log(`PASS ${assertions} integration groups. Actual MySQL: ${db.hostname}:${db.port}${db.pathname}.`);
} finally {
  await stop();
  writeFileSync(resolve(root, '.local/integration-server.log'), log);
}
