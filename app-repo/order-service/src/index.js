const express = require('express');
const cors = require('cors');
const axios = require('axios');
const client = require('prom-client');
const app = express();
const PORT = process.env.PORT || 3003;

const USER_SERVICE_URL    = process.env.USER_SERVICE_URL    || 'http://localhost:3001';
const PRODUCT_SERVICE_URL = process.env.PRODUCT_SERVICE_URL || 'http://localhost:3002';

app.use(cors());
app.use(express.json());

// ── Prometheus metrics ─────────────────────────────────────────
const register = new client.Registry();
client.collectDefaultMetrics({ register });

const httpRequestCounter = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route'],
  buckets: [0.01, 0.05, 0.1, 0.3, 0.5, 1, 2],
  registers: [register],
});

// Business metric — tracks orders created and their revenue
const ordersCreatedTotal = new client.Counter({
  name: 'orders_created_total',
  help: 'Total number of orders created',
  registers: [register],
});

const orderRevenueTotal = new client.Counter({
  name: 'order_revenue_total',
  help: 'Total revenue from orders',
  registers: [register],
});

app.use((req, res, next) => {
  const end = httpRequestDuration.startTimer({ method: req.method, route: req.path });
  res.on('finish', () => {
    httpRequestCounter.inc({ method: req.method, route: req.path, status_code: res.statusCode });
    end();
  });
  next();
});

app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

// ── Existing routes ────────────────────────────────────────────
const orders = [];

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'order-service' }));

app.post('/orders', async (req, res) => {
  const { userId, productId, quantity } = req.body;
  try {
    const userRes    = await axios.get(`${USER_SERVICE_URL}/users/${userId}`);
    const productRes = await axios.get(`${PRODUCT_SERVICE_URL}/products/${productId}`);

    const order = {
      id: orders.length + 1,
      user: userRes.data,
      product: productRes.data,
      quantity,
      total: productRes.data.price * quantity,
      createdAt: new Date().toISOString(),
    };
    orders.push(order);

    // Increment business metrics
    ordersCreatedTotal.inc();
    orderRevenueTotal.inc(order.total);

    res.status(201).json(order);
  } catch (err) {
    if (err.response?.status === 404) {
      return res.status(404).json({ error: 'User or product not found' });
    }
    res.status(500).json({ error: 'Service communication failed', details: err.message });
  }
});

app.get('/orders', (req, res) => res.json(orders));

app.listen(PORT, () => console.log(`Order service running on port ${PORT}`));