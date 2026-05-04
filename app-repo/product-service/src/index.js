const express = require('express');
const cors = require('cors');
const client = require('prom-client');
const app = express();
const PORT = process.env.PORT || 3002;

app.use(cors());
app.use(express.json());

// ── Prometheus metrics setup ──────────────────────────────────
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

// Business metric — track how many times each product is viewed
const productViewsCounter = new client.Counter({
  name: 'product_views_total',
  help: 'Total number of product detail views',
  labelNames: ['product_id', 'product_name'],
  registers: [register],
});

// Middleware — records metrics on every request automatically
app.use((req, res, next) => {
  const end = httpRequestDuration.startTimer({
    method: req.method,
    route: req.path,
  });
  res.on('finish', () => {
    httpRequestCounter.inc({
      method: req.method,
      route: req.path,
      status_code: res.statusCode,
    });
    end();
  });
  next();
});

// ── Metrics endpoint — Prometheus scrapes this ─────────────────
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

// ── Existing routes ────────────────────────────────────────────
const products = [
  { id: 1, name: 'Laptop',   price: 999, stock: 50  },
  { id: 2, name: 'Monitor',  price: 299, stock: 30  },
  { id: 3, name: 'Keyboard', price: 79,  stock: 100 },
];

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'product-service' });
});

app.get('/products', (req, res) => {
  res.json(products);
});

app.get('/products/:id', (req, res) => {
  const product = products.find(p => p.id === parseInt(req.params.id));
  if (!product) return res.status(404).json({ error: 'Product not found' });

  // Track which products are being viewed
  productViewsCounter.inc({
    product_id: String(product.id),
    product_name: product.name,
  });

  res.json(product);
});

app.listen(PORT, () => console.log(`Product service running on port ${PORT}`));