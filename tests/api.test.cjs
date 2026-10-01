/* Run with: node --test tests/api.test.cjs. No packages needed. */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function storage() {
  const values = new Map();
  return { getItem: key => values.get(key) || null, setItem: (key, value) => values.set(key, value), removeItem: key => values.delete(key), values };
}
function setup() {
  const localStorage = storage(); const sessionStorage = storage();
  const context = vm.createContext({ localStorage, sessionStorage, console }); context.window = context;
  ['data', 'api'].forEach(name => vm.runInContext(fs.readFileSync(path.join(__dirname, '../js', name + '.js'), 'utf8'), context));
  return { api: context.DLF.api, localStorage, sessionStorage };
}
const login = api => api.loginUser({ email: 'student@eng.ruh.ac.lk', password: 'demo', remember: false });
const report = { name: 'Test Lab Notebook', category: 'Books', color: 'Blue', date: '2026-09-30', location: 'Library', description: 'Notebook used to test the report workflow.' };

test('sample data and compound search cover name, category, color, location and type', async () => {
  const { api } = setup();
  assert.equal((await api.getItems()).length, 16);
  const found = await api.searchItems('black electronics library found');
  assert.equal(found.length, 1); assert.equal(found[0].id, 7);
  assert.equal((await api.getLostItems({ category: 'Books', date: '2026-09-26' }))[0].id, 6);
  assert.equal((await api.searchItems('no-such-item')).length, 0);
});
test('registration, profile and session lifecycle never persist passwords', async () => {
  const { api, localStorage, sessionStorage } = setup();
  const user = await api.registerUser({ name: 'Test Student', registration: 'EG/TEST', email: 'test@example.edu', password: 'not-stored-123' });
  await assert.rejects(api.registerUser({ ...user, password: 'not-stored-123' }), /already registered/);
  await api.loginUser({ email: user.email, password: 'any', remember: true });
  assert.equal((await api.getUser()).name, 'Test Student');
  assert.ok(localStorage.getItem('dlf-v1-session')); assert.equal(sessionStorage.getItem('dlf-v1-session'), null);
  await api.updateProfile({ name: 'Updated Student' });
  assert.equal((await api.getUser()).name, 'Updated Student');
  assert.equal(JSON.stringify([...localStorage.values]).includes('not-stored-123'), false);
  await api.logout(); assert.equal(api.getSession(), null);
});
test('reports support create, edit, resolve and delete with ownership checks', async () => {
  const { api } = setup(); await login(api);
  assert.equal((await api.getMyReports()).length, 3);
  const created = await api.reportLostItem(report);
  assert.equal((await api.getMyReports()).length, 4);
  assert.equal((await api.getItem(created.id)).name, report.name);
  await api.updateReport(created.id, { ...report, name: 'Updated Notebook' });
  assert.equal((await api.getItem(created.id)).name, 'Updated Notebook');
  await assert.rejects(api.deleteReport(2), /not available to edit/);
  await api.resolveReport(created.id); assert.equal((await api.getItem(created.id)).status, 'Resolved');
  await api.deleteReport(created.id); assert.equal(await api.getItem(created.id), undefined);
  await api.logout(); await assert.rejects(api.reportLostItem(report), /log in/);
});
test('claims validate proof, reject duplicates and create unread notifications', async () => {
  const { api } = setup(); await login(api);
  await assert.rejects(api.claimItem(2, 'short'), /15 characters/);
  await assert.rejects(api.claimItem(1, 'This is a long proof of ownership.'), /not available to claim/);
  await api.claimItem(2, 'It has a distinctive mark under the bottle.');
  await assert.rejects(api.claimItem(2, 'It has a distinctive mark under the bottle.'), /already submitted/);
  assert.equal((await api.getNotifications()).filter(note => !note.read).length, 4);
  await api.markNotificationsRead(); assert.equal((await api.getNotifications()).filter(note => !note.read).length, 0);
});
test('matches follow ownership, dismissal and report resolution', async () => {
  const { api } = setup(); await login(api);
  assert.equal((await api.getMatches()).length, 2);
  await api.dismissMatch(1); assert.equal((await api.getMatches()).length, 1);
  await api.resolveReport(4); assert.equal((await api.getMatches()).length, 0);
});
test('new accounts have private report and notification state', async () => {
  const { api } = setup(); await login(api); await api.markNotificationsRead(); await api.logout();
  await api.registerUser({ name: 'Another Student', registration: 'EG/OTHER', email: 'another@example.edu', password: 'example123' });
  await api.loginUser({ email: 'another@example.edu', password: 'demo' });
  assert.equal((await api.getMyReports()).length, 0); assert.equal((await api.getMatches()).length, 0); assert.equal((await api.getNotifications()).length, 0);
});
