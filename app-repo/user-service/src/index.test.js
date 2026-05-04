const { test } = require('node:test');
const assert  = require('node:assert');

test('user list is not empty', () => {
  const users = [
    { id: 1, name: 'Alice', email: 'alice@example.com' },
    { id: 2, name: 'Bob',   email: 'bob@example.com'   },
  ];
  assert.strictEqual(users.length, 2);
  assert.strictEqual(users[0].name, 'Alice');
});

test('user lookup by id works', () => {
  const users = [{ id: 1, name: 'Alice', email: 'alice@example.com' }];
  const found = users.find(u => u.id === 1);
  assert.ok(found);
  assert.strictEqual(found.name, 'Alice');
});

test('missing user returns undefined', () => {
  const users = [{ id: 1, name: 'Alice', email: 'alice@example.com' }];
  const found = users.find(u => u.id === 999);
  assert.strictEqual(found, undefined);
});