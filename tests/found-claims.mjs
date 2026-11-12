import assert from 'node:assert/strict';

// Uses only the test server/database owned by the integration harness.
export async function testFoundClaims({ a, b, userA, userB, report, sql, base, passed, client, accountB }) {
  const item = await a.call('/lost-items', { method: 'POST', body: { ...report, title: 'Claim test calculator' }, key: crypto.randomUUID() }, 201);
  const path = `/lost-items/${item.itemId}/claims`;
  const body = { foundLocation: '  Engineering Library desk  ', message: '  I found the calculator beside the reference books.  ' };
  const anonymous = client();
  await anonymous.call(path, { method: 'POST', body }, 401);
  await a.call(path, { method: 'POST', body }, 403);
  await b.call('/lost-items/2147483647/claims', { method: 'POST', body }, 404);
  await b.call('/lost-items/999999999999/claims', { method: 'POST', body }, 400);
  await b.call(path, {}, 405);
  await b.call(path, { method: 'POST', body, headers: { 'X-DLF-Request': '' } }, 403);
  for (const invalid of [
    {}, { ...body, foundLocation: '   ' }, { ...body, message: '   ' },
    { ...body, foundLocation: 'x'.repeat(151) }, { ...body, message: 'x'.repeat(1501) },
    { ...body, foundLocation: 123 }, { ...body, message: [] },
  ]) await b.call(path, { method: 'POST', body: invalid }, 400);
  await b.call(path, { method: 'POST', body: '{broken' }, 400);
  await b.call(path, { method: 'POST', body, headers: { 'Content-Type': 'text/plain' } }, 415);
  passed('claims reject anonymous, self, nonexistent, oversized IDs, invalid data, malformed JSON, wrong method and missing CSRF header');

  // All non-open legacy/current statuses are denied, including CLOSED from future modules.
  for (const status of ['RETURNED', 'RESOLVED', 'FOUND', 'CLOSED']) {
    sql(`UPDATE lost_items SET status='${status}' WHERE item_id=${item.itemId}`);
    await b.call(path, { method: 'POST', body }, 409);
  }
  assert.equal(sql(`SELECT COUNT(*) FROM found_claims WHERE lost_item_id=${item.itemId}`), '0');
  sql(`UPDATE lost_items SET status='LOST' WHERE item_id=${item.itemId}`);
  passed('claims reject returned, resolved, legacy found and closed lost-item reports without creating rows');

  const receipt = await b.call(path, { method: 'POST', body: { ...body, finderId: Number(userA.id), ownerId: Number(userB.id), status: 'RETURNED' } }, 201);
  assert.ok(receipt.claimId > 0);
  assert.deepEqual(receipt, { claimId: receipt.claimId, itemId: item.itemId, finderId: Number(userB.id), ownerId: Number(userA.id), status: 'PENDING' });
  assert.equal(sql(`SELECT CONCAT(found_location, '|', message, '|', status) FROM found_claims WHERE claim_id=${receipt.claimId}`),
    `${body.foundLocation.trim()}|${body.message.trim()}|PENDING`);
  assert.equal(sql(`SELECT status FROM lost_items WHERE item_id=${item.itemId}`), 'LOST');
  const duplicate = await b.call(path, { method: 'POST', body }, 409);
  assert.match(duplicate.error, /already submitted/);
  passed('Student B submits A calculator claim: HTTP 201, correct generated IDs, trimmed MySQL data, PENDING, unchanged report status; duplicate rejected');

  const raceItem = await a.call('/lost-items', { method: 'POST', body: { ...report, title: 'Concurrent claims calculator' }, key: crypto.randomUUID() }, 201);
  sql(`UPDATE lost_items SET status='OPEN' WHERE item_id=${raceItem.itemId}`);
  const responses = await Promise.all(Array.from({ length: 6 }, () => fetch(`${base}/lost-items/${raceItem.itemId}/claims`, {
    method: 'POST', headers: { Cookie: b.cookie, 'Content-Type': 'application/json', 'X-DLF-Request': '1' }, body: JSON.stringify(body),
  })));
  assert.deepEqual(responses.map(response => response.status).sort(), [201, 409, 409, 409, 409, 409]);
  await Promise.all(responses.map(response => response.json()));
  assert.equal(sql(`SELECT COUNT(*) FROM found_claims WHERE lost_item_id=${raceItem.itemId} AND finder_id=${Number(userB.id)}`), '1');
  passed('six concurrent submissions produce exactly one claim and five HTTP 409 responses; legacy OPEN is eligible');

  await b.call('/auth/logout', { method: 'POST' }, 204);
  await b.call('/auth/login', { method: 'POST', body: accountB });
  const refreshed = client(); refreshed.cookie = b.cookie;
  await refreshed.call(path, { method: 'POST', body }, 409);
  assert.equal(sql(`SELECT COUNT(*) FROM found_claims WHERE claim_id=${receipt.claimId} AND status='PENDING'`), '1');
  // Claim history is protected rather than silently cascading on a report deletion.
  await a.call(`/lost-items/${item.itemId}`, { method: 'DELETE' }, 409);
  passed('claim survives logout/login and a fresh client; foreign key preserves claim history on report deletion');
  return receipt;
}
