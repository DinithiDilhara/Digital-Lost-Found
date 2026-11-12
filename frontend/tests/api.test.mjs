import assert from 'node:assert/strict';
import { test, afterEach } from 'node:test';
const originalFetch = globalThis.fetch;
afterEach(() => { globalThis.fetch = originalFetch; });
const fresh = async () => (await import(`../src/services/api.js?test=${crypto.randomUUID()}`)).api;
const json = (value, status = 200) => new Response(JSON.stringify(value), { status, headers: { 'Content-Type': 'application/json' } });
const row = { itemId: 7, userId: 2, title: 'Calculator', dateLost: '2026-10-01', dateFound: '2026-10-02', status: 'LOST' };

test('lost and found IDs remain distinct, legacy statuses normalize and search includes descriptions', async () => {
  globalThis.fetch = async url => json([{ ...row, description: 'Silver cover', status: url.includes('found') ? 'FOUND' : 'LOST' }]);
  const api = await fresh();
  const rows = await api.getItems();
  assert.deepEqual(rows.map(item => item.id).sort(), ['found-7', 'lost-7']);
  assert.ok(rows.every(item => item.status === 'Open' && item.ownerId === '2'));
  assert.equal(api.filterItems(rows, { query: 'silver calculator', type: 'lost' }).length, 1);
});
test('network/database failure never falls back to browser or sample reports', async () => {
  const api = await fresh();
  globalThis.fetch = async () => { throw new TypeError('offline'); };
  await assert.rejects(api.getItems(), /Cannot connect/);
  globalThis.fetch = async () => json({ error: 'database failed' }, 503);
  await assert.rejects(api.getMyReports(), /MySQL is unavailable/);
});
test('report writes send Java field names and stable retry keys without browser ownership', async () => {
  const calls = [];
  globalThis.fetch = async (url, options) => { calls.push({ url, options }); return json(row, 201); };
  const api = await fresh();
  const values = { name: 'Calculator', date: '2026-10-01', description: 'Silver cover', category: 'Electronics', location: 'Library', ownerId: '999', userId: 999 };
  const key = crypto.randomUUID();
  await api.reportLostItem(values, key);
  await api.reportLostItem(values, key);
  assert.equal(calls[0].url, '/api/lost-items');
  assert.equal(calls[0].options.credentials, 'same-origin');
  assert.equal(calls[0].options.headers['X-DLF-Request'], '1');
  assert.equal(calls[0].options.headers['Idempotency-Key'], calls[1].options.headers['Idempotency-Key']);
  const body = JSON.parse(calls[0].options.body);
  assert.equal(body.title, 'Calculator'); assert.equal(body.dateLost, values.date);
  assert.ok(!('userId' in body)); assert.ok(!('ownerId' in body));
});
test('details use the individual endpoint and missing reports do not use local fallbacks', async () => {
  const api = await fresh();
  globalThis.fetch = async url => { assert.equal(url, '/api/found-items/7'); return json({ error: 'missing' }, 404); };
  assert.equal(await api.getItem('found-7'), null);
  await assert.rejects(api.getItem('7'), /Invalid report link/);
});
test('authentication is accepted only after server success, and revoked sessions clear memory', async () => {
  const api = await fresh();
  globalThis.fetch = async () => json({ error: 'Incorrect email or password.' }, 401);
  await assert.rejects(api.loginUser({ email: 'a@example.edu', password: 'wrong' }), /Incorrect/);
  assert.equal(api.getSession(), null);
  globalThis.fetch = async () => json({ id: '3', name: 'Student A' });
  await api.loginUser({}); assert.equal(api.getSession().id, '3');
  globalThis.fetch = async () => json({ error: 'Expired' }, 401);
  await assert.rejects(api.getUser(), /Expired/);
  assert.equal(api.getSession(), null);
});
test('My Reports combines only the authenticated server response', async () => {
  const api = await fresh();
  globalThis.fetch = async url => { assert.equal(url, '/api/me/reports'); return json({ lost: [row], found: [] }); };
  assert.deepEqual((await api.getMyReports()).map(item => item.id), ['lost-7']);
});
test('notifications use the authenticated server endpoints', async () => {
  const calls = [];
  globalThis.fetch = async (url, options = {}) => {
    calls.push({ url, options });
    if (url === '/api/notifications') return json([{ id: 8, type: 'CLAIM_SUBMITTED', read: false }]);
    if (url === '/api/notifications/unread-count') return json({ count: 1 });
    return json({ updated: 1 });
  };
  const api = await fresh();
  assert.equal((await api.getNotifications())[0].id, 8);
  assert.equal(await api.getUnreadNotificationCount(), 1);
  await api.markNotificationRead(8);
  await api.markAllNotificationsRead();
  assert.equal(calls[2].url, '/api/notifications/8/read');
  assert.equal(calls[2].options.method, 'PATCH');
  assert.equal(calls[3].url, '/api/notifications/read');
  assert.equal(calls[3].options.method, 'PATCH');
});
test('message API uses item type and server-side session without sender or recipient IDs', async () => {
  const calls = [];
  globalThis.fetch = async (url, options = {}) => {
    calls.push({ url, options });
    if (url === '/api/conversations') return json({ conversationId: 31, message: { id: 5 } });
    if (url === '/api/conversations/31/messages' && options.method === 'POST') return json({ id: 6 });
    if (url === '/api/conversations/unread-count') return json({ count: 2 });
    return json([]);
  };
  const api = await fresh();
  const key = crypto.randomUUID();
  await api.contactReporter('found-7', 'Could you share more details?', key);
  await api.getConversations();
  await api.getConversationMessages(31);
  await api.replyToConversation(31, 'Please describe the label.', key);
  await api.markConversationRead(31);
  assert.equal(await api.getUnreadMessageCount(), 2);

  const initialBody = JSON.parse(calls[0].options.body);
  assert.deepEqual(initialBody, {
    itemType: 'found',
    itemId: 7,
    message: 'Could you share more details?',
  });
  assert.equal(calls[0].options.headers['Idempotency-Key'], key);
  assert.ok(!('senderId' in initialBody));
  assert.ok(!('recipientId' in initialBody));
  assert.equal(calls[2].url, '/api/conversations/31/messages');
  assert.equal(calls[4].url, '/api/conversations/31/read');
});
test('report dates reject future or impossible calendar days and allow today or past dates', async () => {
  const { filterDateError, reportDateError, today } = await import('../src/utils.js');
  const fixedToday = '2026-11-11';
  assert.equal(reportDateError(fixedToday, fixedToday), '');
  assert.equal(reportDateError('2026-11-10', fixedToday), '');
  assert.match(reportDateError('2026-11-12', fixedToday), /cannot be in the future/);
  assert.match(reportDateError('2026-02-30', fixedToday), /valid calendar date/);
  assert.equal(filterDateError('', fixedToday), '');
  assert.equal(filterDateError('2026-11-10', fixedToday), '');
  assert.match(filterDateError('2026-11-12', fixedToday), /cannot be in the future/);
  assert.match(filterDateError('2026-02-30', fixedToday), /valid calendar date/);
  const parts = new Intl.DateTimeFormat('en', {
    timeZone: 'Asia/Colombo', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(new Date());
  const date = Object.fromEntries(parts.map(part => [part.type, part.value]));
  assert.equal(today(), `${date.year}-${date.month}-${date.day}`);
});
