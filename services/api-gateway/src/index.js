const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const rateLimit = require('express-rate-limit');
const { createProxyMiddleware } = require('http-proxy-middleware');
const jwt = require('jsonwebtoken');
const logger = require('./logger');
const { register: metricsRegister, collectDefaultMetrics } = require('prom-client');

dotenv.config();
collectDefaultMetrics();

const app = express();
const PORT = process.env.PORT || 3000;

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://auth-service:3001';
const NOTES_SERVICE_URL = process.env.NOTES_SERVICE_URL || 'http://notes-service:3002';

if (!process.env.JWT_SECRET) {
  if (process.env.NODE_ENV === 'production') {
    console.error('FATAL: JWT_SECRET is not set. Exiting.');
    process.exit(1);
  } else {
    console.warn('WARNING: JWT_SECRET not set – using insecure default. Do NOT use in production!');
  }
}

const JWT_SECRET = process.env.JWT_SECRET || 'change_me_in_production';

app.use(cors());
//app.use(express.json());

// Global rate limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later' },
});
app.use(limiter);

// Stricter limiter for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Too many auth attempts, please try again later' },
});

// Health probes
app.get('/health', (req, res) => res.json({ status: 'ok', service: 'api-gateway' }));
app.get('/ready', (req, res) => res.json({ status: 'ready', service: 'api-gateway' }));

// Metrics endpoint for Prometheus
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', metricsRegister.contentType);
  res.end(await metricsRegister.metrics());
});

// JWT validation middleware
function jwtMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return res.status(401).json({ error: 'No token provided' });

  const token = authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Malformed authorization header' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.headers['x-user-id'] = String(decoded.userId);
    req.headers['x-user-email'] = decoded.email;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// Request logger middleware
app.use((req, res, next) => {
  logger.info('Incoming request', {
    method: req.method,
    path: req.path,
    ip: req.ip,
  });
  next();
});

// ── Auth routes (no JWT required) ───────────────────────────────────────────
app.use(
  '/api/auth',
  authLimiter,
  createProxyMiddleware({
    target: AUTH_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: { '^/api/auth': '/auth' },
    on: {
      error: (err, req, res) => {
        logger.error('Auth proxy error', { error: err.message });
        res.status(502).json({ error: 'Auth service unavailable' });
      },
    },
  })
);

// ── Notes routes (JWT required) ─────────────────────────────────────────────
app.use(
  '/api/notes',
  jwtMiddleware,
  createProxyMiddleware({
    target: NOTES_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: { '^/api/notes': '/notes' },
    on: {
      error: (err, req, res) => {
        logger.error('Notes proxy error', { error: err.message });
        res.status(502).json({ error: 'Notes service unavailable' });
      },
    },
  })
);

app.listen(PORT, () => {
  logger.info(`API Gateway running on port ${PORT}`);
});
