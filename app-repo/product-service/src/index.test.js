const { test } = require('node:test');
const assert  = require('node:assert');

test('product list has correct structure', () => {
  const products = [
    { id: 1, name: 'Laptop',  price: 999, stock: 50 },
    { id: 2, name: 'Monitor', price: 299, stock: 30 },
  ];
  assert.strictEqual(products.length, 2);
  assert.ok(products[0].price > 0);
});

test('product price calculation is correct', () => {
  const product  = { id: 1, name: 'Laptop', price: 999 };
  const total    = product.price * 3;
  assert.strictEqual(total, 2997);
});