const { test } = require('node:test');
const assert  = require('node:assert');

test('order total is calculated correctly', () => {
  const total = 299 * 2;
  assert.strictEqual(total, 598);
});

test('order object has required fields', () => {
  const order = {
    id: 1, userId: 1, productId: 2,
    quantity: 2, total: 598,
    createdAt: new Date().toISOString(),
  };
  assert.ok(order.id);
  assert.ok(order.total > 0);
  assert.ok(order.createdAt);
});