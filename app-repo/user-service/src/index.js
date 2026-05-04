const express = require('express');
const cors = require('cors');
const client = require('prom-client');
const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// ── Prometheus metrics setup ──────────────────────────────────
const register = new client.Registry();
client.collectDefaultMetrics({ register });  // CPU, memory, event loop

// Custom counter — tracks how many times each endpoint is called
const httpRequestCounter = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

// Custom histogram — tracks response time
const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route'],
  buckets: [0.01, 0.05, 0.1, 0.3, 0.5, 1, 2],
  registers: [register],
});

// Middleware to record metrics on every request
app.use((req, res, next) => {
  const end = httpRequestDuration.startTimer({ 
    method: req.method, 
    route: req.path 
  });
  res.on('finish', () => {
    httpRequestCounter.inc({ 
      method: req.method, 
      route: req.path, 
      status_code: res.statusCode 
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

// ── Existing routes (unchanged) ───────────────────────────────
const users = [
  { id: 1, name: 'Alice', email: 'alice@example.com' },
  { id: 2, name: 'Bob',   email: 'bob@example.com'   },
];

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'user-service' }));
app.get('/users', (req, res) => res.json(users));
app.get('/users/:id', (req, res) => {
  const user = users.find(u => u.id === parseInt(req.params.id));
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
});
app.post('/users', (req, res) => {
  const user = { id: users.length + 1, ...req.body };
  users.push(user);
  res.status(201).json(user);
});

app.listen(PORT, () => console.log(`User service running on port ${PORT}`));